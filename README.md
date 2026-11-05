# Magical English Word Games

An interactive English vocabulary learning game for kids, themed around awizzard universe. Learn new words by matching, typing, or listening — three difficulty levels provide growing challenges, and stars reward every achievement.

## Features

- **3 Game Modes**
  - **Easy** — Drag & drop English words to their Dutch translations
  - **Medium** — See a Dutch word with an image, type the English translation
  - **Hard** — Listen to an English word (TTS) and select the correct Dutch translation
- **Progressive unlocking** — Complete a difficulty with 2+ stars to unlock the next level
- **Star tracking** — Total stars persist across browser sessions via localStorage
- **Harry Potter theme** — Magical design with gold accents, Cinzel font, and themed mascot messages
- **Touch-friendly** — Works on desktop, tablet, and mobile
- **Extensible** — Add new word topics by dropping JSON files into the `data/` folder

## Word List Format

Place JSON files in the `data/` directory. Each file defines a topic:

```json
{
  "topic": "Topic Name",
  "words": [
    {
      "english": "dog",
      "dutch": "hond",
      "image": "assets/images/dog.png"
    }
  ]
}
```

- `topic` — Display name shown on the topic selection screen
- `words` — Array of word pairs with English, Dutch, and an optional image path
- Images are shown on the right column (Game 1) and in the center (Games 2 & 3)

## Adding New Topics

1. Create a JSON file in `data/` (e.g. `fruits.json`)
2. Add your word pairs in the format above
3. Add matching image files to `assets/images/`
4. Refresh the page — the new topic appears automatically

## Running Locally

```bash
cd english-games
python3 -m http.server 8000
```

Open http://127.0.0.1:8000

To share on your network, bind to all interfaces:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Then visit `http://<your-mac-ip>:8000` from any device on the same network.

## Tech Stack

- Pure HTML, CSS, and vanilla JavaScript — no frameworks or build tools
- Web Speech API for text-to-speech (Game 3)
- localStorage for persistent progress
- CSS Grid and Flexbox for responsive layout
- Google Fonts (Cinzel + Nunito)

## Browser Support

Works in all modern browsers. Text-to-speech quality depends on the available English voices on the user's system. Chrome and Edge typically offer the best results.
