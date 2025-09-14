# quickstart documentation: https://inference-docs.cerebras.ai/quickstart

import os
import sys
from cerebras.cloud.sdk import Cerebras


def parse_transcript(filePath):
    try:
        with open(filePath, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except FileNotFoundError:
        print(f"Error: File '{filePath}' not found.")
        return None
    except Exception as e:
        print(f"Error reading file: {e}")
        return None

# def save_parsed_transcript(content, outputPath):
#     try:
#         with open(outputPath, 'w', encoding='utf-8') as file:
#             file.write(content)
#         print(f"Processed text saved to: {outputPath}")
#     except Exception as e:
#         print(f"Error saving file: {e}")

def annotate_speech(userPrompt):
    
    client = Cerebras(
        api_key=os.environ.get("CEREBRAS_API_KEY"),
    )

    systemPrompt = """You are a helpful assistant that annotates speech-to-text transcripts by adding clarifications, intermediate steps, and mathematical explanations as annotations.

        You MUST use format --> annotation text for ALL annotations. With a space padding the text on the left.

        Your task:
        1. Take the raw speech-to-text transcript exactly as provided.
        2. Add annotations using --> markers and add it where appropriate. Go to new line before and after annotation.
            You MUST use this format: --> annotation text for ALL annotations (ie. anything not apart of original transcript), not just every other annotation.
        3. Insert intermediate mathematical steps where needed
        4. Add explanations for mathematical reasoning, NO filler phrases.
        5. Keep the original text completely unchanged.
        6. Keep annotations very clear and concise. NO filler phrases.
        7. Maintain syntax of natural language. For example, use 3/5 isntead of frac.

        Add annotations for:
        - Mathematical intermediate steps
        - Clarifications of ambiguous statements  
        - Explanations of reasoning
        - Proper mathematical notation where helpful """

    chatCompletion = client.chat.completions.create(
        messages=[
            {
                "role": "system", 
                "content": systemPrompt
            },
            {
                "role": "user", 
                "content": userPrompt
            }
        ],
        model="llama-4-scout-17b-16e-instruct",
    )

    return chatCompletion.choices[0].message.content

def main():
    inputFile = "speech_transcript.txt" # change this to the file name idk where its being transcribed
    
    speechText = parse_transcript(inputFile)
    
    if speechText is None:
        print("Transcript could not be parsed.")
        return

    annotatedText = annotate_speech(speechText) # transcript annotated by cerebras

    # print("-" * 200)
    print(annotatedText)
    # print("-" * 200)
    
    # outputFile = ".txt??" # replace with whatever is being funnelled into grace's nl --> math translator
    # save_parsed_transcript(annotatedText, outputFile)

if __name__ == "__main__":
    main()