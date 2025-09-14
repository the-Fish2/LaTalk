Instructions for setup

1. Download the MentraOS app
2. Pair to the relevant pair of glasses
3. Get the MentraOS developer portal access granted by Nishka (send her ur email)

code setup:
1. build venv in src/backend, run pip install -r requirements.txt
2. npm install in latalk_web
3. install bun

Set up website:
backend on port 3000
1. uvicorn latalk_web.src.backend.main:app --reload --port 3000
frontend on port 3001 (or more)
3. npm start

Set up ngrok:
1. Get an ngrok account. 
2. config your auth token in vscode
3. run 'ngrok http http://localhost:8080'
3. Modify the mentraos app to have the url indicated by ngrok in "Forwarding  https://b1441dc21326.ngrok-free.app -> http://localhost:8080"                                                

Set up Graphics:

0. Wear glasses
1. cd mentra-graphics
2. bun run index.ts
3. Select app 'Mentra Graphics' + toggle on

Say something and watch it appear on the web app and also on your glasses! :)