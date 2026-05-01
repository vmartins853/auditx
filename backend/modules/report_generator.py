import os
from datetime import datetime

REPORTS_DIR = "/tmp/auditx_reports"
os.makedirs(REPORTS_DIR, exist_ok=True)


def build_html(data: dict) -> str:
    alvo        = data.get("alvo", "N/D")
    auditor     = data.get("auditor", "N/D")
    data_str    = data.get("data", datetime.now().strftime("%d/%m/%Y"))
    descricao   = data.get("descricao", "")
    scanner     = data.get("scanner", None)
    dns         = data.get("dns", None)
    ai_analysis = data.get("ai_analysis", None)

    def severity_color(s):
        return {"Alta": "#ff4444", "Média": "#ffaa00", "Baixa": "#4488ff"}.get(s, "#888")

    # Secção Scanner
    scanner_html = ""
    if scanner and scanner.get("parsed"):
        rows = "".join(f"""
        <tr>
          <td>{p['port']}</td>
          <td>{p['protocol']}</td>
          <td>{p['service']}</td>
          <td>{p.get('version') or '—'}</td>
        </tr>""" for p in scanner["parsed"])
        scanner_html = f"""
        <div class="section">
          <h2>🔍 Port Scanner</h2>
          <p><strong>Comando:</strong> <code>{scanner.get('command','')}</code></p>
          <p><strong>Portas abertas:</strong> {len(scanner['parsed'])}</p>
          <table>
            <thead><tr><th>Porta</th><th>Protocolo</th><th>Serviço</th><th>Versão</th></tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>"""

    # Secção DNS
    dns_html = ""
    if dns and dns.get("records"):
        records_html = ""
        for rtype, vals in dns["records"].items():
            if vals:
                records_html += f"<tr><td><strong>{rtype}</strong></td><td>{'<br>'.join(vals)}</td></tr>"

        subdomains_html = ""
        if dns.get("subdomains"):
            sub_rows = "".join(f"<tr><td>{s['subdomain']}</td><td>{s['type']}</td><td>{', '.join(s.get('records', []))}</td></tr>"
                               for s in dns["subdomains"])
            subdomains_html = f"""
            <h3>Subdomínios Encontrados</h3>
            <table>
              <thead><tr><th>Subdomínio</th><th>Tipo</th><th>Endereço</th></tr></thead>
              <tbody>{sub_rows}</tbody>
            </table>"""

        dns_html = f"""
        <div class="section">
          <h2>🌐 DNS Recon</h2>
          <p><strong>Domínio:</strong> {dns.get('domain','')}</p>
          <table>
            <thead><tr><th>Tipo</th><th>Registos</th></tr></thead>
            <tbody>{records_html}</tbody>
          </table>
          {subdomains_html}
        </div>"""

    # Secção AI Analyzer
    ai_html = ""
    if ai_analysis:
        riscos_html = ""
        for r in ai_analysis.get("riscos", []):
            color = severity_color(r.get("severidade", ""))
            riscos_html += f"""
            <div class="risk-card">
              <div class="risk-header">
                <span>{r.get('titulo','')}</span>
                <span class="badge" style="background:{color}22;color:{color};border:1px solid {color}44">{r.get('severidade','')}</span>
              </div>
              <p>{r.get('descricao','')}</p>
            </div>"""

        recs_html = "".join(f"<li>{r}</li>" for r in ai_analysis.get("recomendacoes", []))
        passos_html = "".join(f"<li><code>{p}</code></li>" for p in ai_analysis.get("proximos_passos", []))

        ai_html = f"""
        <div class="section">
          <h2>🤖 Análise de IA</h2>
          <div class="summary-box">
            <strong>Resumo:</strong><br>{ai_analysis.get('resumo','')}
          </div>
          <h3>Riscos Identificados</h3>
          {riscos_html}
          <h3>Recomendações</h3>
          <ul>{recs_html}</ul>
          <h3>Próximos Passos</h3>
          <ul>{passos_html}</ul>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 13px; line-height: 1.6; }}
  .header {{ background: #0a0a0f; color: white; padding: 32px 40px; }}
  .header h1 {{ font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }}
  .header h1 span {{ color: #00ff88; }}
  .header .meta {{ margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }}
  .header .meta p {{ font-size: 12px; color: #94a3b8; }}
  .header .meta strong {{ color: #e2e8f0; }}
  .disclaimer {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 16px; margin: 20px 40px; font-size: 11px; color: #856404; }}
  .descricao {{ margin: 0 40px 20px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }}
  .descricao h3 {{ font-size: 13px; color: #64748b; margin-bottom: 6px; }}
  .section {{ margin: 0 40px 28px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; }}
  .section h2 {{ font-size: 16px; font-weight: 600; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #00ff88; color: #0f172a; }}
  .section h3 {{ font-size: 13px; font-weight: 600; margin: 16px 0 8px; color: #374151; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }}
  th {{ background: #f1f5f9; padding: 8px 12px; text-align: left; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; }}
  td {{ padding: 7px 12px; border-bottom: 1px solid #f1f5f9; color: #374151; }}
  tr:hover td {{ background: #f8fafc; }}
  code {{ background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 11px; color: #0f172a; }}
  .summary-box {{ background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 14px; color: #166534; font-size: 12px; }}
  .risk-card {{ border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; }}
  .risk-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-weight: 600; font-size: 13px; }}
  .badge {{ padding: 2px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }}
  ul {{ padding-left: 18px; }}
  ul li {{ margin-bottom: 5px; font-size: 12px; color: #374151; }}
  .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 40px; margin-top: 20px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }}
</style>
</head>
<body>
  <div class="header">
    <h1>Audit<span>X</span> — Relatório de Auditoria</h1>
    <div class="meta">
      <p><strong>Alvo:</strong> {alvo}</p>
      <p><strong>Data:</strong> {data_str}</p>
      <p><strong>Auditor:</strong> {auditor}</p>
      <p><strong>Gerado em:</strong> {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
    </div>
  </div>

  <div class="disclaimer">
    ⚠ Este relatório destina-se exclusivamente a fins educativos e a testes em ambientes autorizados.
  </div>

  {"<div class='descricao'><h3>Descrição / Âmbito</h3><p>" + descricao + "</p></div>" if descricao else ""}

  {scanner_html}
  {dns_html}
  {ai_html}

  <div class="footer">
    <span>AuditX v0.1.0 — PIEI-22</span>
    <span>Gerado automaticamente em {datetime.now().strftime('%d/%m/%Y às %H:%M')}</span>
  </div>
</body>
</html>"""


def generate_pdf_report(data: dict) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    html_content = build_html(data)

    try:
        from weasyprint import HTML
        pdf_path = f"{REPORTS_DIR}/auditx_report_{timestamp}.pdf"
        HTML(string=html_content).write_pdf(pdf_path)
        return pdf_path
    except Exception:
        html_path = f"{REPORTS_DIR}/auditx_report_{timestamp}.html"
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return html_path
