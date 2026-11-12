# Magical English Word Games

An interactive English vocabulary learning game for kids, themed around a wizard
universe. Learn new words by matching, typing, listening, or flipping memory
cards — every game rewards you with stars.

## Features

- **Player name** — asked once on first visit, then used in the mascot's messages
- **4 game modes**
  - **Woorden Koppelen** — Drag & drop (or tap) English words onto their Dutch translations
  - **Typ het Woord** — See a Dutch word with an image, type the English translation
  - **Luister en Kies** — Listen to an English word (TTS) and select the correct Dutch translation
  - **Memory** — Flip cards to find the English–Dutch pairs
- **Progressive unlocking** — Finish a game with 2+ stars to unlock the next one
- **Star tracking** — Total stars persist across browser sessions via localStorage
- **Wizard theme** — Magical design with gold accents, Cinzel font, and themed mascot messages
- **Touch-friendly** — Works on desktop, tablet, and mobile
- **Extensible** — Add new word topics by dropping JSON files into the `data/` folder

## Memory game rules

- Up to 7 word pairs per round (fewer if the word list is smaller)
- One extra "wizard" card without a pair is shuffled in, so the last remaining
  pair is not a dead giveaway
- Only the Dutch card shows the picture — matching images alone cannot win the game
- Cards flip with a 3D animation; matched pairs stay face up
- Because Memory involves many more flips than the other games, its star
  thresholds scale with the number of pairs instead of using a flat mistake limit

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
- Images are shown on the right column (Game 1), in the center (Games 2 & 3),
  and on the Dutch cards only (Memory)

## Adding New Topics

1. Create a JSON file in `data/` (e.g. `fruits.json`)
2. Add your word pairs in the format above
3. Add matching image files to `assets/images/`
4. Add the filename (without `.json`) to the `topics` array in `data/topics.json`
5. Refresh the page — the new topic appears on the home screen

## Running Locally

```bash
cd engels
python3 -m http.server 8000
```

Open http://127.0.0.1:8000

To share on your network, bind to all interfaces:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Then visit `http://<your-ip>:8000` from any device on the same network.

## Tech Stack

- Pure HTML, CSS, and vanilla JavaScript — no frameworks or build tools
- Web Speech API for text-to-speech (Game 3)
- localStorage for persistent progress and the player name
- CSS Grid and Flexbox for responsive layout, CSS 3D transforms for the Memory cards
- Google Fonts (Cinzel + Nunito)

## Browser Support

Works in all modern browsers. Text-to-speech quality depends on the available
English voices on the user's system. Chrome and Edge typically offer the best results.
