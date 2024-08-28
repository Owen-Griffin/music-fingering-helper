import './fingering-helper-quiz.css';

//const frequencyElement = document.getElementById('frequency') as HTMLParagraphElement;


async function logMicrophoneFrequency() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new (window.AudioContext || window.AudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

        analyser.fftSize = 2048;
        microphone.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        scriptProcessor.onaudioprocess = () => {
            const dataArray = new Float32Array(analyser.fftSize);
            analyser.getFloatTimeDomainData(dataArray);

            let bestOffset = -1;
            let bestCorrelation = 0;
            let rms = 0;

            for (let i = 0; i < dataArray.length; i++) {
                rms += dataArray[i] * dataArray[i];
            }

            rms = Math.sqrt(rms / dataArray.length);

            if (rms < 0.01) {
                console.log("No signal detected");
                return;
            }

            const size = dataArray.length;
            const correlations = new Array<number>(size).fill(0);

            for (let offset = 0; offset < size; offset++) {
                let correlation = 0;

                for (let i = 0; i < size - offset; i++) {
                    correlation += dataArray[i] * dataArray[i + offset];
                }

                correlations[offset] = correlation;

                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestOffset = offset;
                }
            }

            if (bestCorrelation > 0.01) {
                const frequency = audioContext.sampleRate / bestOffset;
                console.log(`Frequency: ${Math.round(frequency)} Hz`);
            } else {
                console.log("No significant frequency detected");
            }
        };
    } catch (error) {
        console.error("Microphone access denied", error);
    }
}

logMicrophoneFrequency();