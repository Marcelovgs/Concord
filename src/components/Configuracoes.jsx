import React, { useEffect, useState, useRef } from 'react'

export default function Configuracoes({ fechar, sensibilidade, setSensibilidade }) {
    const [volumeAtual, setVolumeAtual] = useState(0)
    const audioCtxRef = useRef(null)
    const analyserRef = useRef(null)
    const sourceRef = useRef(null)
    const animationFrameRef = useRef(null)

    useEffect(() => {
        let streamLocal = null

        const iniciarTesteAudio = async () => {
            try {
                streamLocal = await navigator.mediaDevices.getUserMedia({ audio: true })
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
                analyserRef.current = audioCtxRef.current.createAnalyser()
                analyserRef.current.fftSize = 256

                sourceRef.current = audioCtxRef.current.createMediaStreamSource(streamLocal)
                sourceRef.current.connect(analyserRef.current)

                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

                const loop = () => {
                    if (!analyserRef.current) return
                    analyserRef.current.getByteFrequencyData(dataArray)
                    let soma = 0
                    for (let i = 0; i < dataArray.length; i++) {
                        soma += dataArray[i]
                    }
                    const media = soma / dataArray.length
                    // Mapeia a frequência para uma escala de 0 a 50 (igual ao nosso slider)
                    const valorNormalizado = Math.min(50, (media / 128) * 50)
                    setVolumeAtual(valorNormalizado)

                    animationFrameRef.current = requestAnimationFrame(loop)
                }
                loop()
            } catch (err) {
                console.warn("Não foi possível aceder ao microfone para o teste visual:", err)
            }
        }

        iniciarTesteAudio()

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close()
            }
            if (streamLocal) {
                streamLocal.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    // Cálculo da percentagem da barra e da posição do marcador de sensibilidade
    const percentagemVolume = (volumeAtual / 50) * 100
    const percentagemSensibilidade = (sensibilidade / 50) * 100
    const estaAcimaDoLimite = volumeAtual >= sensibilidade

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div style={{ backgroundColor: '#313338', padding: '32px', borderRadius: '8px', width: '600px', maxWidth: '90%', color: '#dbdee1', boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontFamily: '"gg sans", "Noto Sans", Helvetica, Arial, sans-serif' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2023', paddingBottom: '16px', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, color: '#f2f3f5', fontSize: '20px' }}>Voz e Vídeo</h2>
                    <button onClick={fechar} style={{ background: 'transparent', border: 'none', color: '#dbdee1', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>✕</button>
                </div>

                {/* MEDIDOR DE TESTE ESTILO DISCORD */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#b5bac1', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Teste de Microfone
                    </label>
                    <div style={{ position: 'relative', height: '12px', backgroundColor: '#1e1f22', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                        {/* Barra de volume verde dinâmica */}
                        <div style={{
                            width: `${percentagemVolume}%`,
                            height: '100%',
                            backgroundColor: estaAcimaDoLimite ? '#23a559' : '#e0b50f',
                            transition: 'width 0.05s ease-out, background-color 0.1s'
                        }} />
                        {/* Linha indicadora do Limite de Sensibilidade */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: `${percentagemSensibilidade}%`,
                            width: '4px',
                            backgroundColor: '#fff',
                            transform: 'translateX(-50%)',
                            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                        }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#949ba4' }}>
                        Fale para testar. A barra verde/amarela mostra o seu som e a linha branca indica o ponto de corte.
                    </span>
                </div>

                {/* CONTROLE DE SENSIBILIDADE */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#b5bac1', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Sensibilidade de Entrada (Atividade de Voz)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={sensibilidade}
                            onChange={(e) => setSensibilidade(parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: '#5865F2' }}
                        />
                        <span style={{ fontSize: '14px', width: '40px', textAlign: 'right', fontWeight: 'bold' }}>{sensibilidade}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#949ba4', marginTop: '8px' }}>
                        Ajuste para que ruídos de fundo fiquem abaixo da linha branca.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
                    <button onClick={fechar} style={{ padding: '8px 24px', backgroundColor: '#5865F2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Feito</button>
                </div>
            </div>
        </div>
    )
}