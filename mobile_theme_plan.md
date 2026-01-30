# Mobile Theme Implementation Plan

**Goal:** Implement "Vibrant Gradient" theme for mobile users only.

## 1. CSS Updates (`index.css`)
- Define `bg-vibrant-gradient` (Deep Purple -> Cyber Blue).
- Define `glass-card-mobile` (Lighter, more transparent for gradient visibility).
- Define `nav-pill-mobile` (Floating bottom nav).

## 2. Layout Updates (`EmployeeLayout.jsx`)
- **Wrapper:** Detect mobile (or use generic responsive classes) to apply the gradient background.
- **Navigation:** Replace the bottom utility bar with a floating "Island" or Pill design.
- **Cards:** Ensure dashboard cards use the transparency to let the gradient show through.

## 3. Component Updates
- **Dashboard:** Ensure text contrast is high (White text on gradient).
