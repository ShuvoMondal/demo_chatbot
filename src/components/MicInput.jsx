import React, { useEffect, useState, useRef } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import OpenAI from "openai";

function MicInput() {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const [gptResponse, setGptResponse ] = useState('');
    const [isMicrophoneOn, setIsMicrophoneOn] = useState(false);
    const [thinking, setThinking] = useState(false);
    const [textValue, setTextValue] = useState('');
    const synthesisRef = useRef(null);

    const handleTextAreaChange = (event) => {
        setTextValue(event.target.value);
    };

    const handleToggleMicrophone = () => {
        if (isMicrophoneOn) {
            SpeechRecognition.stopListening();
            setTextValue(transcript);
        } else {
            resetTranscript();
            setTextValue('')
            startListening();
        }
        setIsMicrophoneOn((prev) => !prev);
    };
    
    
    if (!browserSupportsSpeechRecognition) {
        return <span>Browser doesn't support speech recognition.</span>;
    }

    const startListening = () => SpeechRecognition.startListening({ continuous:true, language:"en-IN"})
    const openaiClient = new OpenAI({
        apiKey: "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",
        dangerouslyAllowBrowser: true
    });

    async function callChatGPT(message) {
        try {
            const response = await openaiClient.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: message }],
                temperature: 0,
                max_tokens: 1000,
            }).then(res => res.choices)
                .then(res => res.map((res) => res.message.content)[0]);
            return response;
        } catch (err) {
        console.log(err.message);
            return err;
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setGptResponse('');
            setThinking(true)
            const data = await callChatGPT(textValue || transcript);
            setTextValue('');
            resetTranscript();
            setThinking(false);
            setGptResponse(data);
        } catch (error) {
        console.error('Error submitting form:', error);
        }
    };

    const speakHandler = async(e) =>{
        if(gptResponse){
            const speechSynthesis =  window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(gptResponse);
            synthesisRef.current = utterance;
            speechSynthesis.speak(utterance);
        }
        return '';
    }

    const handleCancel = () => {
        if (synthesisRef.current) {
            window.speechSynthesis.cancel();
        }
    };

    const handlePause = () => {
        if (synthesisRef.current) {
            window.speechSynthesis.pause();
        }
    };

    const handleResume = () => {
        if (synthesisRef.current) {
            window.speechSynthesis.resume();
        }
    };

    return (
        <>
            <div>
                <p>Microphone: {isMicrophoneOn ? 'ON' : 'OFF'}</p>
                <button onClick={handleToggleMicrophone}>
                    {isMicrophoneOn ? 'Stop Listening' : 'Start Listening'}
                </button>
                <button onClick={() =>{
                    setTextValue('');
                    resetTranscript();
                    setGptResponse('');
                }}>Reset</button>
                <form onSubmit={handleSubmit}>
                    <textarea type="text" name="transacript" value={listening ? transcript : textValue}  onChange={handleTextAreaChange}/>
                    <button type="submit">Submit</button>
                </form>
                {thinking && <div>processing......</div>}
                {gptResponse && <div>
                                    <p>{gptResponse}</p>
                                    <button onClick={speakHandler}>Speak</button>
                                    <button onClick={handleCancel}>Cancel Speak</button>
                                    <button onClick={handlePause}>Pause</button>
                                    <button onClick={handleResume}>Resume</button>
                                </div>}

            </div>
        </>
    )
}

export default MicInput