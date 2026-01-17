// NeuralNetwork.tsx - Reusable neural network visualization

import React, { useRef, useEffect } from 'react';

interface NeuralNetworkProps {
    isTraining: boolean;
    height?: number;
    numPeers?: number;
    epochs?: number;
}

export const NeuralNetwork: React.FC<NeuralNetworkProps> = ({
    isTraining,
    height = 400,
    numPeers = 4,
    epochs = 10
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const generateLayers = () => {
            const layers = [];
            const numLayers = Math.max(2, Math.min(numPeers + 2, 8));
            const maxNeurons = 8;
            const minNeurons = 2;

            for (let i = 0; i < numLayers; i++) {
                const progress = i / (numLayers - 1);
                const neurons = Math.round(maxNeurons - (maxNeurons - minNeurons) * progress);
                let size;
                if (i === 0) size = 784;
                else if (i === numLayers - 1) size = 10;
                else size = Math.round(128 / (i * 0.5 + 1));

                layers.push({
                    neurons,
                    label: `P${i + 1}`,
                    size,
                    epoch: Math.round((epochs / numLayers) * (i + 1))
                });
            }
            return layers;
        };

        const layers = generateLayers();
        const padding = 60;
        const layerSpacing = (canvas.width - padding * 2) / (layers.length - 1);

        let pulsePhase = 0;
        let connectionPulses: Array<{
            from: number;
            to: number;
            fromNeuron: number;
            toNeuron: number;
            progress: number;
            speed: number;
        }> = [];

        const neuronPositions = layers.map((layer, layerIdx) => {
            const x = padding + layerIdx * layerSpacing;
            const neuronSpacing = (canvas.height - padding * 2) / (layer.neurons - 1);
            return Array.from({ length: layer.neurons }, (_, neuronIdx) => ({
                x,
                y: padding + neuronIdx * neuronSpacing,
                active: false,
                activation: 0
            }));
        });

        const createPulse = () => {
            if (!isTraining) return;
            const fromLayer = Math.floor(Math.random() * (layers.length - 1));
            const toLayer = fromLayer + 1;
            const fromNeuron = Math.floor(Math.random() * layers[fromLayer].neurons);
            const toNeuron = Math.floor(Math.random() * layers[toLayer].neurons);
            connectionPulses.push({
                from: fromLayer,
                to: toLayer,
                fromNeuron,
                toNeuron,
                progress: 0,
                speed: 0.02 + Math.random() * 0.03
            });
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pulsePhase += 0.02;

            connectionPulses = connectionPulses.filter(pulse => {
                pulse.progress += pulse.speed;
                return pulse.progress <= 1;
            });

            if (isTraining && Math.random() < 0.3) {
                createPulse();
            }

            // Draw connections
            layers.forEach((layer, layerIdx) => {
                if (layerIdx < layers.length - 1) {
                    neuronPositions[layerIdx].forEach((fromPos, fromIdx) => {
                        neuronPositions[layerIdx + 1].forEach((toPos) => {
                            ctx.strokeStyle = 'rgba(249, 115, 22, 0.1)';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(fromPos.x, fromPos.y);
                            ctx.lineTo(toPos.x, toPos.y);
                            ctx.stroke();
                        });
                    });
                }
            });

            // Draw pulses
            connectionPulses.forEach(pulse => {
                const fromPos = neuronPositions[pulse.from][pulse.fromNeuron];
                const toPos = neuronPositions[pulse.to][pulse.toNeuron];
                const x = fromPos.x + (toPos.x - fromPos.x) * pulse.progress;
                const y = fromPos.y + (toPos.y - fromPos.y) * pulse.progress;

                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
                gradient.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
                gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.4)');
                gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw neurons
            neuronPositions.forEach((layerNeurons, layerIdx) => {
                layerNeurons.forEach((pos, neuronIdx) => {
                    const isActive = connectionPulses.some(
                        p => (p.from === layerIdx && p.fromNeuron === neuronIdx) ||
                            (p.to === layerIdx && p.toNeuron === neuronIdx)
                    );

                    if (isTraining) {
                        const glowIntensity = isActive ? 0.6 : 0.2 + Math.sin(pulsePhase + neuronIdx) * 0.1;
                        const glowRadius = isActive ? 12 : 8;
                        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
                        gradient.addColorStop(0, `rgba(249, 115, 22, ${glowIntensity})`);
                        gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.fillStyle = isActive && isTraining ? '#f97316' : 'rgba(249, 115, 22, 0.3)';
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
                    ctx.fill();

                    if (isActive && isTraining) {
                        ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                });

                // Draw labels
                const layer = layers[layerIdx];
                const firstNeuron = layerNeurons[0];
                ctx.fillStyle = '#9aa0a6';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(layer.label, firstNeuron.x, canvas.height - 25);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#6b7280';
                ctx.fillText(`E${layer.epoch}`, firstNeuron.x, canvas.height - 10);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isTraining, numPeers, epochs]);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            height: `${height}px`,
            background: isTraining
                ? 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.05) 0%, transparent 70%)'
                : 'transparent',
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'background 0.5s ease'
        }}>
            <canvas
                ref={canvasRef}
                width={1200}
                height={height}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: height > 250 ? '48px' : '24px',
                fontWeight: '700',
                color: isTraining ? '#f97316' : 'rgba(249, 115, 22, 0.3)',
                textShadow: isTraining ? '0 0 20px rgba(249, 115, 22, 0.5)' : 'none',
                letterSpacing: '0.1em',
                fontFamily: 'monospace',
                transition: 'all 0.5s ease',
                pointerEvents: 'none',
                animation: isTraining ? 'pulse 2s ease-in-out infinite' : 'none'
            }}>
                {isTraining ? '[TRAINING]' : '[READY]'}
            </div>
            <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
        </div>
    );
};