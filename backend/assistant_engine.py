"""
assistant_engine.py  –  Chintu AI Assistant Brain
"""
import random, re
from datetime import datetime
from typing import Optional

INTENT_CHAT="chat"; INTENT_QUERY="query"; INTENT_COMMAND="command"
INTENT_SMARTHOME="smarthome"; INTENT_EMOTIONAL="emotional"
INTENT_GREETING="greeting"; INTENT_WEATHER="weather"; INTENT_TIME="time"
INTENT_JOKE="joke"; INTENT_MUSIC="music"; INTENT_REMINDER="reminder"
INTENT_STATUS="status"

GREETING_WORDS=["hello","hi","hey","good morning","good evening","good afternoon","howdy","namaste","what's up"]
TIME_WORDS=["time","clock","what time","current time","hour","date","today","day","month"]
WEATHER_WORDS=["weather","rain","sunny","forecast","climate","temperature outside"]
JOKE_WORDS=["joke","funny","laugh","humor","make me laugh"]
MUSIC_WORDS=["music","play song","play music","song","playlist","spotify"]
EMOTIONAL_WORDS=["stress","sad","angry","feel","feeling","tired","anxious","depressed","worried","scared","frustrated","lonely"]
REMINDER_WORDS=["remind","reminder","alarm","alert me","notify me","set alarm"]
SMARTHOME_WORDS=["light","lights","lamp","fan","ac","air condition","door","lock","unlock","curtain","tv","television","security","camera","sprinkler","heater","turn on","turn off","switch on","switch off","bedroom","living room","kitchen","garden","thermostat"]
COMMAND_WORDS=["open","launch","start","run","search","google","youtube","calculator","notepad","browser","settings"]
STATUS_WORDS=["status","system","how are you","all good","report","diagnostics","battery","network"]

EMOTION_PREFIXES={
    "Angry":["I sense tension. Let me help. ","Take a breath. "],
    "Sadness":["You're not alone, Sujal. ","I'm with you. "],
    "Fear":["You're safe here. ","I've got everything under control. "],
    "Happiness":["Love the energy! ","Wonderful! "],
    "Confused":["Let me help clarify. ","Happy to explain. "],
    "Excited":["Your enthusiasm is amazing! ","Let's go! "],
    "Surprised":["Interesting! ","Let me process that. "],
    "Thoughtful":["I see you're focused. ","Deep thinking mode — I like it. "],
    "Scanning…":["",""],
}

def _hour_greeting():
    h=datetime.now().hour
    if 5<=h<12: return "Good morning"
    if 12<=h<17: return "Good afternoon"
    if 17<=h<21: return "Good evening"
    return "Good night"

GREETING_RESPONSES=[
    "{g}, Sujal! I'm Chintu, your personal AI assistant. All systems are online. How can I help?",
    "{g}! Chintu AI fully operational. Emotion detection active, smart home synced. What would you like to do?",
    "Hey! I'm Chintu — your emotion-aware AI companion. {g}! Ready for your commands.",
]

def get_time_response():
    now=datetime.now()
    t=now.strftime("%I:%M %p"); d=now.strftime("%A, %d %B %Y")
    return random.choice([f"It's {t} on {d}.", f"The time is {t}. Today is {d}.", f"Right now it's {t}, {d}."])

WEATHER_CONDITIONS=[
    "Currently 28°C, partly cloudy with a gentle breeze. Perfect for a walk outside!",
    "It's 32°C and sunny outside. Stay hydrated! UV index is moderate.",
    "Overcast skies, 24°C with a chance of light rain later this evening.",
    "26°C, pleasant weather. Humidity at 65%. A lovely day ahead!",
]
JOKES=[
    "Why do programmers prefer dark mode? Because light attracts bugs! 😄",
    "Why was the robot cold? It left its Windows open! 😂",
    "How many programmers to change a light bulb? None — that's a hardware problem!",
    "My neural network wrote poetry: 'Roses are #FF0000, violets are #0000FF' — close enough.",
]
MUSIC_RESPONSES=[
    "Opening Spotify and playing your Focus Playlist. Enjoy the music, Sujal! 🎵",
    "Activating ambient study music. Smart speaker volume set to a comfortable level.",
    "Playing your Evening Chill playlist. Lights dimmed to 40% for the perfect vibe.",
]
EMOTIONAL_SUPPORT={
    "Angry":["Stress detected. I've switched lights to calming blue and queued relaxation music. Deep breaths, Sujal.","High tension detected. Dimming lights and silencing non-critical notifications so you can decompress."],
    "Sadness":["You seem down today — that's okay. Everyone has those days. Want me to play some uplifting music?","Remember, Sujal — you've overcome every difficult moment so far. Your resilience is remarkable."],
    "Fear":["You're safe — all security sensors are active and all clear. No threats detected anywhere.","Safety mode activated. All cameras at full sensitivity. I'm monitoring everything. Breathe easy."],
    "Happiness":["Your happiness is contagious! Lights set to vibrant celebration mode. What's the good news?","I love seeing you happy, Sujal! Enabling celebration mode. What shall we do?"],
}
STATUS_RESPONSES=[
    "All systems nominal. Emotion engine at peak. Smart home synchronized. Security active. Operating at 100%.",
    "Diagnostics complete: Emotion AI ✅ | Smart Home ✅ | Security ✅ | Network ✅. Everything looks great!",
]
GENERAL_RESPONSES=[
    "Noted, Sujal. Is there anything specific I can help you with right now?",
    "Understood. I'm here for both tasks and conversation. What else can I do for you?",
    "I hear you. Running at full capacity — ready for your next command.",
    "Interesting. I've logged that in our session memory. Anything else on your mind?",
]

def smart_home_response(key, state):
    labels={"livingRoomLight":"Living room lights","bedroomLight":"Bedroom lights","kitchenLight":"Kitchen lights","gardenLight":"Garden lights","doorLocked":"Front door","alarmArmed":"Security alarm","acOn":"Air conditioning","tvOn":"Smart TV","curtainsClosed":"Curtains","sprinklers":"Garden sprinklers"}
    label=labels.get(key,key); action="on" if state else "off"
    return random.choice([f"{label} switched {action}.",f"Got it! {label} are now {action}.",f"{label} {'activated' if state else 'deactivated'} successfully."])

def parse_smarthome(text):
    t=text.lower()
    on=any(w in t for w in ["turn on","switch on"," on","activate","enable","open"])
    off=any(w in t for w in ["turn off","switch off"," off","deactivate","disable","close"])
    action=True if on else(False if off else None)
    dmap={"bedroom light":"bedroomLight","bedroom lights":"bedroomLight","living room light":"livingRoomLight","living room lights":"livingRoomLight","kitchen light":"kitchenLight","kitchen lights":"kitchenLight","garden light":"gardenLight","garden lights":"gardenLight","door":"doorLocked","lock":"doorLocked","alarm":"alarmArmed","security":"alarmArmed","ac":"acOn","air conditioning":"acOn","air conditioner":"acOn","tv":"tvOn","television":"tvOn","curtain":"curtainsClosed","curtains":"curtainsClosed","sprinkler":"sprinklers","sprinklers":"sprinklers","light":"livingRoomLight","lights":"livingRoomLight"}
    key=None
    for phrase,k in dmap.items():
        if phrase in t: key=k; break
    return key, action

def classify_intent(text):
    t=text.lower()
    if any(w in t for w in GREETING_WORDS): return INTENT_GREETING
    if any(w in t for w in TIME_WORDS): return INTENT_TIME
    if any(w in t for w in WEATHER_WORDS): return INTENT_WEATHER
    if any(w in t for w in JOKE_WORDS): return INTENT_JOKE
    if any(w in t for w in MUSIC_WORDS): return INTENT_MUSIC
    if any(w in t for w in REMINDER_WORDS): return INTENT_REMINDER
    if any(w in t for w in SMARTHOME_WORDS): return INTENT_SMARTHOME
    if any(w in t for w in STATUS_WORDS): return INTENT_STATUS
    if any(w in t for w in EMOTIONAL_WORDS): return INTENT_EMOTIONAL
    if any(w in t for w in COMMAND_WORDS): return INTENT_COMMAND
    return INTENT_CHAT

class AssistantBrain:
    def __init__(self):
        self.history=[]
        self.current_emotion="Scanning…"
        self.reminders=[]
        self.smart_home={
            "livingRoomLight":True,"bedroomLight":False,"kitchenLight":True,
            "gardenLight":False,"doorLocked":True,"alarmArmed":False,
            "acOn":True,"tvOn":False,"curtainsClosed":False,"sprinklers":False,
        }

    def _hist(self,role,text):
        self.history.append({"role":role,"text":text})
        if len(self.history)>20: self.history=self.history[-20:]

    def _prefix(self,emotion):
        prefixes=EMOTION_PREFIXES.get(emotion or self.current_emotion,[""])
        return random.choice(prefixes)

    def process(self, user_text:str, emotion:Optional[str]=None)->dict:
        if emotion: self.current_emotion=emotion
        self._hist("user",user_text)
        intent=classify_intent(user_text)
        device_key=None; device_state=None; response=""

        if intent==INTENT_GREETING:
            response=random.choice(GREETING_RESPONSES).format(g=_hour_greeting())
        elif intent==INTENT_TIME:
            response=get_time_response()
        elif intent==INTENT_WEATHER:
            response=random.choice(WEATHER_CONDITIONS)
        elif intent==INTENT_JOKE:
            response=random.choice(JOKES)
        elif intent==INTENT_MUSIC:
            response=self._prefix(emotion)+random.choice(MUSIC_RESPONSES)
        elif intent==INTENT_REMINDER:
            m=re.search(r"remind me (?:to|about|for) (.+)",user_text.lower())
            task=m.group(1) if m else "your task"
            self.reminders.append(task)
            response=f"Reminder set for: '{task}'. I'll alert you!"
        elif intent==INTENT_SMARTHOME:
            device_key,action=parse_smarthome(user_text)
            if device_key and action is not None:
                self.smart_home[device_key]=action; device_state=action
                response=smart_home_response(device_key,action)
            else:
                on_count=sum(1 for v in self.smart_home.values() if v is True)
                response=f"Smart home operational. {on_count} devices active. What would you like to control?"
        elif intent==INTENT_STATUS:
            response=random.choice(STATUS_RESPONSES)
        elif intent==INTENT_EMOTIONAL:
            emo=emotion or self.current_emotion
            pool=EMOTIONAL_SUPPORT.get(emo,EMOTIONAL_SUPPORT["Sadness"])
            response=random.choice(pool)
        elif intent==INTENT_COMMAND:
            t=user_text.lower()
            if "youtube" in t: response="Opening YouTube for you right now!"
            elif "google" in t or "search" in t:
                q=re.sub(r"(search|google|open|find)","",t).strip()
                response=f"Searching Google for '{q}'." if q else "Opening Google!"
            elif "calculator" in t: response="Calculator launched!"
            elif "notepad" in t: response="Notepad is open. Ready for your notes."
            elif "settings" in t: response="Opening system settings."
            else:
                app=re.sub(r"(open|launch|start|run)","",t).strip()
                response=f"Attempting to open {app}."
        elif any(w in user_text.lower() for w in ["what can you do","help","capabilities"]):
            response="I can control smart home devices, answer questions, tell time/weather, play music, open apps, and provide emotion-aware support. Just ask!"
        else:
            prefix=self._prefix(emotion) if emotion and emotion!="Scanning…" else ""
            response=prefix+random.choice(GENERAL_RESPONSES)

        self._hist("assistant",response)
        return {"response":response,"intent":intent,"device_key":device_key,"device_state":device_state,"smart_home_state":self.smart_home.copy()}

    def get_history(self): return list(self.history)
    def reset(self): self.history=[]; self.reminders=[]

brain=AssistantBrain()
