import { useEffect, useRef, useState } from 'react'

const VideoRemoto = ({ stream, volume, foneMutado }) => {
    const ref = useRef(null)
    const [bloqueado, setBloqueado] = useState(false)

    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream
            ref.current.play().catch(() => setBloqueado(true))
        }
    }, [stream])

    useEffect(() => { if (ref.current) ref.current.volume = foneMutado ? 0 : volume }, [volume, foneMutado])

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={ref} playsInline style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block' }} />
            <button onClick={() => ref.current?.requestFullscreen()} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', zIndex: 10, fontSize: '14px', fontWeight: 'bold' }}>⛶ Expandir</button>
            {bloqueado && <button onClick={() => { ref.current?.play(); setBloqueado(false) }} style={{ position: 'absolute', zIndex: 10, padding: '10px', backgroundColor: '#23a559', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>▶️ Ouvir</button>}
        </div>
    )
}

// Componente invisível para amigos que estão apenas a falar no chat de voz
const AudioRemoto = ({ stream, volume, foneMutado }) => {
    const ref = useRef(null)
    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream
            ref.current.play().catch(e => console.warn('Bloqueio de autoplay de áudio:', e))
        }
    }, [stream])
    useEffect(() => { if (ref.current) ref.current.volume = foneMutado ? 0 : volume }, [volume, foneMutado])
    return <audio ref={ref} playsInline style={{ display: 'none' }} />
}

export default function VideoArea({ streamLocal, videoLocal, streamsRemotos, volumesUsuarios, foneMutado }) {
    return (
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', backgroundColor: '#313338', minWidth: 0 }}>
            {/* Mostra a sua própria live apenas se estiver a transmitir Vídeo */}
            {streamLocal.current && streamLocal.current.getVideoTracks().length > 0 && (
                <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Sua Transmissão</div>
                    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <video ref={videoLocal} autoPlay playsInline muted style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
                        <button onClick={() => videoLocal.current?.requestFullscreen()} style={{ position: 'absolute', top: '16px', right: '16px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', zIndex: 10, fontSize: '14px', fontWeight: 'bold' }}>⛶ Expandir</button>
                    </div>
                </div>
            )}

            {Object.entries(streamsRemotos).map(([id, stream]) => {
                const temVideo = stream.getVideoTracks().length > 0
                if (temVideo) {
                    // Renderiza o Ecrã se o amigo estiver a fazer Live
                    return (
                        <div key={id} style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Ecrã de {id}</div>
                            <VideoRemoto stream={stream} volume={volumesUsuarios[id]} foneMutado={foneMutado} />
                        </div>
                    )
                } else {
                    // Renderiza o componente de voz invisível
                    return <AudioRemoto key={id} stream={stream} volume={volumesUsuarios[id]} foneMutado={foneMutado} />
                }
            })}
        </div>
    )
}