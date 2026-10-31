export default function ChatPanel({ meuId, meuNome, nomesUsuarios, mensagens, novaMensagem, setNovaMensagem, enviarMensagemDeTexto, chatFimRef }) {
    return (
        <div style={{ width: '350px', backgroundColor: '#313338', borderLeft: '1px solid #3f4147', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #1f2023', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', color: '#80848e', marginRight: '8px' }}>#</span>
                <span style={{ fontWeight: 'bold', color: '#f2f3f5' }}>chat</span>
            </div>
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {mensagens.map((msg) => {
                    const isVocê = msg.remetente === meuId
                    const nomeExibicao = isVocê ? 'Você' : (nomesUsuarios[msg.remetente] || msg.remetente)
                    return (
                        <div key={msg.id} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isVocê ? '#f04747' : '#5865F2', flexShrink: 0 }} />
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontWeight: 'bold', color: '#f2f3f5' }}>{nomeExibicao}</span>
                                    <span style={{ fontSize: '12px', color: '#949ba4' }}>{msg.hora}</span>
                                </div>
                                <div style={{ color: '#dbdee1', marginTop: '4px', wordBreak: 'break-word' }}>{msg.texto}</div>
                            </div>
                        </div>
                    )
                })}
                <div ref={chatFimRef} />
            </div>
            <div style={{ padding: '0 16px 24px 16px' }}>
                <div style={{ backgroundColor: '#383a40', borderRadius: '8px', padding: '10px 16px', display: 'flex' }}>
                    <input type="text" placeholder="Conversar em #chat" value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} onKeyDown={enviarMensagemDeTexto} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#dbdee1', outline: 'none', fontSize: '14px' }} />
                </div>
            </div>
        </div>
    )
}