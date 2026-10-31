export default function Sidebar({ meuId, meuNome, status, usuariosNaSala, nomesUsuarios, usuariosFalando, handleContextMenu, abrirMenuDeJanelas, micMutado, alternarMic, foneMutado, alternarFone, transmitindo, pararTransmissao, abrirConfiguracoes }) {
    return (
        <>
            <div style={{ width: '72px', backgroundColor: '#1e1f22', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '12px', flexShrink: 0 }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#5865F2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>LOG</span>
                </div>
                <div style={{ width: '32px', height: '2px', backgroundColor: '#35363c', marginTop: '8px', borderRadius: '2px' }} />
            </div>

            <div style={{ width: '240px', backgroundColor: '#2b2d31', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '16px', fontWeight: 'bold', borderBottom: '1px solid #1f2023', color: '#f2f3f5' }}>Lair Of Gods</div>
                <div style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#949ba4', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>🔊 CANAL GERAL</div>
                    {usuariosNaSala.map(id => {
                        const isVocê = id === meuId
                        const nomeExibicao = isVocê ? `${meuNome} (Você)` : (nomesUsuarios[id] || id)
                        const falando = usuariosFalando[id]

                        return (
                            <div key={id} onContextMenu={(e) => { e.preventDefault(); if (!isVocê) handleContextMenu(e, id) }} style={{ padding: '6px 8px', margin: '2px 0', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#35373c'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                {/* Anel que pisca kkj */}
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#5865F2', marginRight: '8px',
                                    border: falando ? '2px solid #23a559' : '2px solid transparent', boxSizing: 'border-box', transition: 'border 0.1s'
                                }} />
                                <span style={{ fontSize: '14px', color: isVocê ? '#fff' : '#dbdee1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeExibicao}</span>
                            </div>
                        )
                    })}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#232428', borderBottom: '1px solid #313338' }}>
                    <div style={{ color: '#23a559', fontSize: '14px', fontWeight: 'bold' }}>{status}</div>
                    {transmitindo ? (
                        <button onClick={pararTransmissao} style={{ width: '100%', marginTop: '8px', padding: '6px', backgroundColor: '#ed4245', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🛑 Parar Transmissão</button>
                    ) : (
                        <button onClick={abrirMenuDeJanelas} style={{ width: '100%', marginTop: '8px', padding: '6px', backgroundColor: '#313338', color: '#dbdee1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>📺 Partilhar</button>
                    )}
                </div>
                <div style={{ padding: '8px', backgroundColor: '#232428', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f04747', marginRight: '8px', flexShrink: 0,
                            border: usuariosFalando[meuId] ? '2px solid #23a559' : '2px solid transparent', boxSizing: 'border-box', transition: 'border 0.1s'
                        }} />
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f2f3f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meuNome}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button onClick={alternarMic} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>{micMutado ? '🔇' : '🎙️'}</button>
                        <button onClick={alternarFone} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>{foneMutado ? '🔕' : '🎧'}</button>
                        <button onClick={abrirConfiguracoes} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px' }}>⚙️</button>
                    </div>
                </div>
            </div>
        </>
    )
}