/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioController {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;
  private musicEnabled: boolean = true;

  constructor() {
    // In a real app, these would be URLs to assets. 
    // For this build, I'll use placeholders or simple synthesized sounds if I could, 
    // but standard approach is assets. I'll use some royalty free links or just placeholders.
    const baseUrl = 'https://actions.google.com/sounds/v1/';
    this.sounds = {
      click: new Audio(`${baseUrl}ui/button_click.ogg`),
      flip: new Audio(`${baseUrl}cards/card_flip.ogg`),
      match: new Audio(`${baseUrl}ui/positive_feedback.ogg`),
      error: new Audio(`${baseUrl}ui/negative_feedback.ogg`),
      victory: new Audio(`${baseUrl}alarms/beep_short.ogg`), 
      fanfare: new Audio(`${baseUrl}celebration/horns_fanfare.ogg`)
    };

    // Replace victory with fanfare if we want the 3s music
    this.sounds.victory = this.sounds.fanfare;

    Object.values(this.sounds).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.5;
      audio.load();
    });
  }

  setSFXEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    // Handle background music if implemented
  }

  play(sound: keyof typeof this.sounds) {
    if (this.enabled && this.sounds[sound]) {
      const audio = this.sounds[sound];
      audio.currentTime = 0;
      audio.play().catch(() => { /* User interaction might be needed */ });
    }
  }
}

export const audioController = new AudioController();
