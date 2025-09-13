import speech_recognition as sr
# import inputimeout

recog = sr.Recognizer()
mic = sr.Microphone()

print("Now transcribing audio for 60s.")
# recog.adjust_for_ambient_noise(source, duration=0.5) # adjust audio volumne

recog.energy_threshold = 300 # increase sensitivity to audio
recog.dynamic_energy_threshold = True
recog.pause_threshold = 1
fullText = ""

while True:
    try:
        with mic as source:
            audio = recog.listen(source, phrase_time_limit=5, timeout=10)
            text = recog.recognize_google(audio, language='en-US')
            fullText += text + " "
            print(text)
    except sr.WaitTimeoutError:
        print("No speech detected within 10 seconds.")
        break
    except sr.UnknownValueError:
        print("Audio could not be transcribed.")
    except sr.RequestError as e:
        print(f"Error with speech recognition: {e}")
        break

print(fullText)