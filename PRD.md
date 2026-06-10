# Product Requirements Document (PRD)

## 1. Product Summary

- **What it is:**  
  A wave-based 2D math combat game where enemies are numbers and attacks are mathematical transformations.

- **Who it’s for:**  
  Players interested in games that combine action gameplay with mathematical thinking and progression.

- **Core purpose:**  
  The player controls a character and uses math-based attacks to reduce enemy numbers to zero. Enemies are values (e.g. 5), and attacks transform them (e.g. -1 reduces them to 4, 3, 2, etc.). The game progresses through wave-based levels with slideshow cutscenes introducing concepts, including references to Karl Weierstrass.

---

## 2. Core Features (MVP)

## 2.1 Game Overview

- High-level concept: math combat game where enemies are numbers and attacks are transformations
- MVP scope:
  - Integers only
  - Basic movement
  - One complete level flow

---

## 2.2 Core Gameplay Loop

- Player movement: WASD, static sprite (no animation required)
- Enemy spawn system: wave-based spawning
- Enemy behavior:
  - Moves toward player
  - Variable movement speed
- Combat rules:
  - Attacks apply mathematical transformations (e.g. -1 reduces enemy value)
  - Enemy value updates on every hit
- Win condition:
  - Clear all enemies in a wave
- Lose condition:
  - Enemy touches player → instant game over (MVP)

---

## 3. Entities & Core Systems (IMPORTANT)

### 3.1 Entity Superclass

- Base class for all game entities
- Includes:
  - Sprite support
  - Position tracking
  - Basic movement logic

### 3.2 Player Class

- Controlled via WASD
- Uses selected math attack from hotbar
- Static sprite (MVP)
- Aim attack with mouse, left click to use attack (see hotbar)

### 3.3 Enemy Class

- Holds integer value (MVP)
- Moves toward player
- Responds to transformations (attacks modify value directly)
- Future-ready design for polymorphism (e.g. polynomials, functions, etc.)

---

## 4. Combat / Math System

- Core idea: attacks = mathematical transformations on enemy state (not HP)

### Examples:
- `-1` → subtract 1 from enemy value
- `+1` → add 1
- `d/dx` → future special rule (not in MVP)

### Rules:
- All attacks modify enemy state directly
- If enemy touches player → game over (no player health system in MVP)

### Game Over Screen:
- Game over image
- Return to main menu button

---

## 4.1 Combat UI

- 8-slot hotbar displayed at bottom center of screen
- Slot switching:
  - Mouse scrollwheel
  - Number keys 1–8
- Empty slots:
  - Do nothing when selected
- Starting loadout:
  - Slot 1: +1 attack
  - Slot 2: -1 attack
- Each occupied slot displays an icon/image

---

## 5. Spawning / Wave System

- Fixed-size waves
- Spawn in batches or timed intervals
- Scaling difficulty system (optional future extension)

---

## 6. UI System

### 6.1 Main Menu

- Play button → starts Level 1
- Future expansions:
  - Level select
  - Save system

### 6.2 Button System (Reusable Component)

- Generic UI button class
- Supports click actions
- Reusable across menus and UI screens

---

## 7. Slideshow System (Reusable Component)

- Image-based content system
- Configurable:
  - Animation style
  - Duration per slide
- Interaction:
  - Click to progress
- Use cases:
  - Tutorials
  - Story cutscenes
  - Level transitions

---

## 8. MVP Level 1

- Play intro cutscene slideshow
- Show instructions:
  - How to switch hotbar items
  - Left click to shoot
  - Keep enemies from reaching the player
- Spawn phase 1:
  - 2 random numbers between 2–10
  - Used for testing basic attack mechanics
- After completion:
  - Spawn wave of numbers between -10 and 10
  - Exclude zero

---

## 9. Tech Stack

- Phaser
- Vite
- TypeScript