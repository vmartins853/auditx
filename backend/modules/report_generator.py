# ─────────────────────────────────────────────────────────────────────────────
# modules/report_generator.py — Módulo de Geração de Relatórios PDF
#
# Este módulo constrói relatórios de auditoria em formato PDF a partir dos
# resultados dos outros módulos (Port Scanner, DNS Recon, Security Headers,
# TLS Inspector, AI Analyzer) e do histórico de execuções.
#
# O processo é:
#   1. Receber os dados estruturados de cada módulo via dicionário Python
#   2. Construir um documento HTML completo com os dados formatados (build_html)
#   3. Converter o HTML para PDF usando a biblioteca WeasyPrint (generate_pdf_report)
#
# Se o WeasyPrint não estiver disponível (ex: dependências em falta), o módulo
# cria um ficheiro HTML como alternativa, garantindo que o relatório é sempre
# gerado independentemente das dependências do sistema.
#
# Os relatórios são guardados temporariamente em /tmp/auditx_reports/
# ─────────────────────────────────────────────────────────────────────────────

import os
import html  # Escapar valores dinâmicos para evitar injeção de HTML no relatório
from datetime import datetime

from version import __version__  # Versão centralizada

# Diretório temporário onde os relatórios gerados são guardados
# /tmp é limpo automaticamente pelo sistema operativo ao reiniciar
REPORTS_DIR = "/tmp/auditx_reports"
os.makedirs(REPORTS_DIR, exist_ok=True)  # Cria o diretório se não existir


def _fmt_ts(ts: str) -> str:
    """Formata um timestamp ISO 8601 para uma forma legível (dd/mm/aaaa HH:MM).

    Se o valor não for um ISO válido, devolve-o tal como veio (já escapado pelo
    chamador). Tolera o sufixo 'Z' (UTC) que o JavaScript produz.
    """
    try:
        return datetime.fromisoformat(str(ts).replace("Z", "+00:00")).strftime("%d/%m/%Y %H:%M")
    except Exception:
        return str(ts)


def build_html(data: dict) -> str:
    """
    Constrói o documento HTML completo do relatório de auditoria.

    Recebe os dados dos módulos e gera um documento HTML formatado com CSS
    incorporado, pronto para ser convertido para PDF pelo WeasyPrint.

    Parâmetros:
        data (dict): Dicionário com os dados do relatório:
            - alvo        (str): IP ou domínio auditado
            - auditor     (str): Nome do auditor
            - data        (str): Data da auditoria
            - descricao   (str): Descrição do âmbito da auditoria
            - scanner     (dict): Resultados do Port Scanner (opcional)
            - dns         (dict): Resultados do DNS Recon (opcional)
            - headers     (dict): Resultados do Security Headers (opcional)
            - tls         (dict): Resultados do TLS Inspector (opcional)
            - ai_analysis (dict): Análise da IA (opcional)
            - history     (list): Histórico de execuções da sessão (opcional)

    Devolve:
        str: String com o documento HTML completo
    """

    # ── Extração dos campos do dicionário de dados ────────────────────────────
    # Todos os campos escalares são escapados — vêm de input do utilizador e nunca
    # devem ser interpretados como HTML (evita injeção/SSRF via WeasyPrint e XSS no fallback HTML)
    alvo        = html.escape(str(data.get("alvo", "N/D")))       # "N/D" = Não Definido (valor por omissão)
    auditor     = html.escape(str(data.get("auditor", "N/D")))
    data_str    = html.escape(str(data.get("data", datetime.now().strftime("%d/%m/%Y"))))
    descricao   = html.escape(str(data.get("descricao", "")))
    scanner     = data.get("scanner", None)     # Resultados do Port Scanner (pode ser None)
    dns         = data.get("dns", None)         # Resultados do DNS Recon (pode ser None)
    headers     = data.get("headers", None)     # Resultados do Security Headers (pode ser None)
    tls         = data.get("tls", None)         # Resultados do TLS Inspector (pode ser None)
    ai_analysis = data.get("ai_analysis", None) # Análise de IA (pode ser None)
    history     = data.get("history", None)     # Histórico de execuções (lista, pode ser None)

    def severity_color(s):
        """Devolve a cor HTML correspondente a cada nível de severidade."""
        return {
            "Alta":  "#ff4444",  # Vermelho — risco alto
            "Média": "#ffaa00",  # Laranja — risco médio
            "Baixa": "#4488ff"   # Azul — risco baixo
        }.get(s, "#888")         # Cinzento — severidade desconhecida

    # ── Secção Port Scanner ───────────────────────────────────────────────────
    # Gera a tabela HTML com as portas abertas encontradas pelo Nmap
    # Só é incluída no relatório se o scanner tiver resultados (parsed não vazio)
    scanner_html = ""
    if scanner and scanner.get("parsed"):
        # Gera uma linha de tabela por cada porta aberta encontrada
        rows = "".join(f"""
        <tr>
          <td>{int(p['port'])}</td>
          <td>{html.escape(str(p['protocol']))}</td>
          <td>{html.escape(str(p['service']))}</td>
          <td>{html.escape(str(p.get('version') or '—'))}</td>
        </tr>""" for p in scanner["parsed"])

        scanner_html = f"""
        <div class="section">
          <h2>🔍 Port Scanner</h2>
          <p><strong>Comando:</strong> <code>{html.escape(str(scanner.get('command','')))}</code></p>
          <p><strong>Portas abertas:</strong> {len(scanner['parsed'])}</p>
          <table>
            <thead><tr><th>Porta</th><th>Protocolo</th><th>Serviço</th><th>Versão</th></tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>"""

    # ── Secção DNS Recon ──────────────────────────────────────────────────────
    # Gera a tabela de registos DNS e, opcionalmente, a tabela de subdomínios
    dns_html = ""
    if dns and dns.get("records"):
        # Gera uma linha por tipo de registo DNS com valores encontrados
        records_html = ""
        for rtype, vals in dns["records"].items():
            if vals:
                vals_html = "<br>".join(html.escape(str(v)) for v in vals)
                records_html += f"<tr><td><strong>{html.escape(str(rtype))}</strong></td><td>{vals_html}</td></tr>"

        # Secção de subdomínios — apenas incluída se foram encontrados subdomínios
        subdomains_html = ""
        if dns.get("subdomains"):
            sub_rows = "".join(
                f"<tr><td>{html.escape(str(s['subdomain']))}</td><td>{html.escape(str(s['type']))}</td><td>{html.escape(', '.join(s.get('records', [])))}</td></tr>"
                for s in dns["subdomains"]
            )
            subdomains_html = f"""
            <h3>Subdomínios Encontrados</h3>
            <table>
              <thead><tr><th>Subdomínio</th><th>Tipo</th><th>Endereço</th></tr></thead>
              <tbody>{sub_rows}</tbody>
            </table>"""

        dns_html = f"""
        <div class="section">
          <h2>🌐 DNS Recon</h2>
          <p><strong>Domínio:</strong> {html.escape(str(dns.get('domain','')))}</p>
          <table>
            <thead><tr><th>Tipo</th><th>Registos</th></tr></thead>
            <tbody>{records_html}</tbody>
          </table>
          {subdomains_html}
        </div>"""

    # ── Secção Security Headers ────────────────────────────────────────────────
    # Tabela dos cabeçalhos de segurança avaliados + classificação A–F + fugas de info
    # Só incluída se o módulo correu com sucesso
    headers_html = ""
    if headers and headers.get("status") == "success":
        # Cor da classificação (mesma escala A–F da página Headers)
        grade       = headers.get("grade", "")
        grade_color = {"A": "#22c55e", "B": "#84cc16", "C": "#eab308",
                       "D": "#f97316", "F": "#ef4444"}.get(grade, "#888")

        # Uma linha por cabeçalho avaliado (presente/ausente + recomendação)
        checked_rows = ""
        for c in headers.get("checked", []):
            present      = c.get("present")
            status_txt   = "✓ Presente" if present else "✗ Ausente"
            status_color = "#22c55e" if present else severity_color(c.get("severity", ""))
            rec          = c.get("recommendation") or ""
            rec_html     = f"<br><code>{html.escape(str(rec))}</code>" if rec else ""
            checked_rows += f"""
            <tr>
              <td>{html.escape(str(c.get('header','')))}</td>
              <td style="color:{status_color};font-weight:600">{status_txt}</td>
              <td>{html.escape(str(c.get('severity','')))}</td>
              <td>{html.escape(str(c.get('desc','')))}{rec_html}</td>
            </tr>"""

        # Cabeçalhos que revelam informação do servidor (Server, X-Powered-By, ...)
        leaks_html = ""
        if headers.get("info_leaks"):
            leak_rows = "".join(
                f"<tr><td>{html.escape(str(l.get('header','')))}</td><td><code>{html.escape(str(l.get('value','')))}</code></td></tr>"
                for l in headers["info_leaks"]
            )
            leaks_html = f"""
            <h3>Fugas de Informação</h3>
            <table>
              <thead><tr><th>Cabeçalho</th><th>Valor</th></tr></thead>
              <tbody>{leak_rows}</tbody>
            </table>"""

        headers_html = f"""
        <div class="section">
          <h2>🛡 Security Headers</h2>
          <p><strong>URL:</strong> <code>{html.escape(str(headers.get('final_url') or headers.get('url','')))}</code>
             &nbsp;|&nbsp; <strong>HTTP:</strong> {int(headers.get('status_code', 0))}</p>
          <p><strong>Classificação:</strong>
             <span class="badge" style="background:{grade_color}22;color:{grade_color};border:1px solid {grade_color}44">
               {html.escape(str(grade))} ({int(headers.get('present', 0))}/{int(headers.get('total', 0))})
             </span></p>
          <table>
            <thead><tr><th>Cabeçalho</th><th>Estado</th><th>Severidade</th><th>Descrição / Recomendação</th></tr></thead>
            <tbody>{checked_rows}</tbody>
          </table>
          {leaks_html}
        </div>"""

    # ── Secção TLS / Certificado ───────────────────────────────────────────────
    # Alertas de estado (expirado / a expirar / não confiável / TLS obsoleto)
    # + tabela com os detalhes do certificado. Só incluída em caso de sucesso.
    tls_html = ""
    if tls and tls.get("status") == "success":
        alerts = []
        if tls.get("expired"):
            alerts.append(("#ff4444", "Certificado EXPIRADO"))
        elif isinstance(tls.get("days_left"), int) and tls["days_left"] < 30:
            alerts.append(("#ffaa00", f"Certificado expira em {int(tls['days_left'])} dias"))
        if tls.get("not_yet_valid"):
            alerts.append(("#ff4444", "Certificado ainda não é válido"))
        if not tls.get("trusted"):
            msg = tls.get("trust_error") or "cadeia de confiança não verificada"
            alerts.append(("#ff4444", f"Certificado não confiável: {msg}"))
        if str(tls.get("tls_version", "")) in ("SSLv2", "SSLv3", "TLSv1", "TLSv1.1"):
            alerts.append(("#ffaa00", f"Versão TLS obsoleta ({tls.get('tls_version')})"))

        alerts_html = "".join(
            f'<div class="risk-card" style="border-left:4px solid {c}"><strong style="color:{c}">⚠ {html.escape(m)}</strong></div>'
            for c, m in alerts
        )

        san_html = html.escape(", ".join(tls.get("san", []) or [])) or "—"
        rows = [
            ("Host",                    f"{html.escape(str(tls.get('host','')))}:{int(tls.get('port', 443))}"),
            ("Versão TLS",              html.escape(str(tls.get("tls_version") or "—"))),
            ("Cipher",                  html.escape(str(tls.get("cipher") or "—"))),
            ("Common Name (CN)",        html.escape(str(tls.get("subject_cn") or "—"))),
            ("Emissor",                 html.escape(f"{tls.get('issuer_cn','') or '—'} ({tls.get('issuer_org','') or '—'})")),
            ("Válido de",               html.escape(str(tls.get("valid_from") or "—"))),
            ("Válido até",              html.escape(str(tls.get("valid_until") or "—"))),
            ("Dias até expirar",        html.escape(str(tls.get("days_left", "—")))),
            ("Confiável",               "Sim" if tls.get("trusted") else "Não"),
            ("Algoritmo de assinatura", html.escape(str(tls.get("signature_algorithm") or "—"))),
            ("Nº de série",             html.escape(str(tls.get("serial") or "—"))),
            (f"SANs ({int(tls.get('san_count', 0))})", san_html),
        ]
        rows_html = "".join(f"<tr><td><strong>{k}</strong></td><td>{v}</td></tr>" for k, v in rows)

        tls_html = f"""
        <div class="section">
          <h2>🔒 TLS / Certificado</h2>
          {alerts_html}
          <table>
            <tbody>{rows_html}</tbody>
          </table>
        </div>"""

    # ── Secção AI Analyzer ────────────────────────────────────────────────────
    # Gera os cards de risco, a lista de recomendações e os próximos passos
    ai_html = ""
    if ai_analysis:
        # Gera um card por risco identificado, com a cor correspondente à severidade
        riscos_html = ""
        for r in ai_analysis.get("riscos", []):
            color = severity_color(r.get("severidade", ""))
            riscos_html += f"""
            <div class="risk-card">
              <div class="risk-header">
                <span>{html.escape(str(r.get('titulo','')))}</span>
                <span class="badge" style="background:{color}22;color:{color};border:1px solid {color}44">{html.escape(str(r.get('severidade','')))}</span>
              </div>
              <p>{html.escape(str(r.get('descricao','')))}</p>
            </div>"""

        # Gera listas HTML para recomendações e próximos passos
        recs_html   = "".join(f"<li>{html.escape(str(r))}</li>" for r in ai_analysis.get("recomendacoes", []))
        passos_html = "".join(f"<li><code>{html.escape(str(p))}</code></li>" for p in ai_analysis.get("proximos_passos", []))

        ai_html = f"""
        <div class="section">
          <h2>🤖 Análise de IA</h2>
          <div class="summary-box">
            <strong>Resumo:</strong><br>{html.escape(str(ai_analysis.get('resumo','')))}
          </div>
          <h3>Riscos Identificados</h3>
          {riscos_html}
          <h3>Recomendações</h3>
          <ul>{recs_html}</ul>
          <h3>Próximos Passos</h3>
          <ul>{passos_html}</ul>
        </div>"""

    # ── Secção Histórico de Execuções ─────────────────────────────────────────
    # Apêndice com o registo das execuções dos módulos (vem do localStorage do
    # browser). Só inclui os campos não sensíveis (sem o blob `data`).
    history_html = ""
    if history:
        hist_rows = "".join(f"""
            <tr>
              <td>{html.escape(_fmt_ts(h.get('timestamp','')))}</td>
              <td>{html.escape(str(h.get('type','')))}</td>
              <td>{html.escape(str(h.get('target','')))}</td>
              <td>{html.escape(str(h.get('summary','')))}</td>
            </tr>""" for h in history)

        history_html = f"""
        <div class="section">
          <h2>🕓 Histórico de Execuções</h2>
          <p>Registo das últimas {len(history)} execuções de módulos nesta sessão do navegador.</p>
          <table>
            <thead><tr><th>Data/Hora</th><th>Módulo</th><th>Alvo</th><th>Resumo</th></tr></thead>
            <tbody>{hist_rows}</tbody>
          </table>
        </div>"""

    # ── Documento HTML completo ───────────────────────────────────────────────
    # Retorna o HTML com CSS incorporado, cabeçalho do relatório,
    # disclaimer legal, secções opcionais e rodapé
    return f"""<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<style>
  /* Reset básico e estilos globais */
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; line-height: 1.6; }}

  /* Cabeçalho escuro com informações da auditoria */
  .header {{ background: #0a0a0f; color: white; padding: 32px 40px; }}
  .header h1 {{ font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }}
  .header h1 span {{ color: #00ff88; }}  /* "X" do AuditX em verde */
  .header .meta {{ margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
  .header .meta p {{ font-size: 12px; color: #94a3b8; }}
  .header .meta strong {{ color: #e2e8f0; }}

  /* Aviso legal em amarelo */
  .disclaimer {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 16px; margin: 20px 40px; font-size: 11px; color: #856404; }}

  /* Caixa de descrição do âmbito */
  .descricao {{ margin: 0 40px 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }}
  .descricao h3 {{ font-size: 13px; color: #64748b; margin-bottom: 6px; }}

  /* Secções de cada módulo */
  .section {{ margin: 0 40px 28px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; }}
  .section h2 {{ font-size: 16px; font-weight: 600; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #00ff88; color: #0f172a; }}
  .section h3 {{ font-size: 13px; font-weight: 600; margin: 16px 0 8px; color: #374151; }}

  /* Tabelas de dados */
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }}
  th {{ background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }}
  td {{ padding: 7px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }}
  tr:hover td {{ background: #f8fafc; }}

  /* Estilo de código inline */
  code {{ background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #0f172a; }}

  /* Caixa de resumo da análise de IA */
  .summary-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; color: #166534; font-size: 12px; }}

  /* Cards de risco individuais */
  .risk-card {{ border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; }}
  .risk-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-weight: 600; font-size: 13px; }}
  .badge {{ padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }}

  /* Listas de recomendações */
  ul {{ padding-left: 18px; }}
  ul li {{ margin-bottom: 5px; font-size: 12px; color: #374151; }}

  /* Rodapé */
  .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 40px; margin-top: 20px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }}
</style>
</head>
<body>
  <!-- Cabeçalho com informações da auditoria -->
  <div class="header">
    <h1>Audit<span>X</span> — Relatório de Auditoria</h1>
    <div class="meta">
      <p><strong>Alvo:</strong> {alvo}</p>
      <p><strong>Data:</strong> {data_str}</p>
      <p><strong>Auditor:</strong> {auditor}</p>
      <p><strong>Gerado em:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
    </div>
  </div>

  <!-- Aviso legal obrigatório -->
  <div class="disclaimer">
    ⚠ Este relatório destina-se exclusivamente a fins educativos e a testes em ambientes autorizados.
  </div>

  <!-- Descrição do âmbito — apenas incluída se o utilizador preencheu o campo -->
  {"<div class='descricao'><h3>Descrição / Âmbito</h3><p>" + descricao + "</p></div>" if descricao else ""}

  <!-- Secções dos módulos — cada uma só aparece se tiver dados -->
  {scanner_html}
  {dns_html}
  {headers_html}
  {tls_html}
  {ai_html}
  {history_html}

  <!-- Rodapé com versão e timestamp -->
  <div class="footer">
    <span>AuditX v{__version__} — PIEI-22</span>
    <span>Gerado automaticamente em {datetime.now().strftime('%d/%m/%Y às %H:%M')}</span>
  </div>
</body>
</html>"""


def generate_pdf_report(data: dict) -> str:
    """
    Gera um ficheiro PDF (ou HTML como fallback) com o relatório de auditoria.

    Processo:
      1. Gera o conteúdo HTML com build_html()
      2. Converte o HTML para PDF usando WeasyPrint
      3. Se o WeasyPrint falhar, guarda o HTML como alternativa

    Parâmetros:
        data (dict): Dados do relatório (ver build_html para estrutura completa)

    Devolve:
        str: Caminho completo do ficheiro gerado (PDF ou HTML)
    """

    # Timestamp único para o nome do ficheiro — evita colisões entre relatórios
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Gera o conteúdo HTML do relatório
    html_content = build_html(data)

    try:
        # Importação dentro da função para que o módulo continue a funcionar
        # mesmo que o WeasyPrint não esteja instalado (gera HTML como alternativa)
        from weasyprint import HTML

        pdf_path = f"{REPORTS_DIR}/auditx_report_{timestamp}.pdf"

        # Converte o HTML para PDF e guarda no disco
        # HTML(string=...) recebe o HTML como string em vez de ficheiro
        HTML(string=html_content).write_pdf(pdf_path)

        return pdf_path

    except Exception:
        # WeasyPrint falhou (ex: dependências em falta, erro de renderização)
        # Guarda o HTML como alternativa para que o utilizador ainda consiga
        # aceder ao conteúdo do relatório
        html_path = f"{REPORTS_DIR}/auditx_report_{timestamp}.html"
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return html_path
