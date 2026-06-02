/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioController {
  private sounds: Record<string, HTMLAudioElement> = {};
  private enabled: boolean = true;
  private musicEnabled: boolean = true;

  constructor() {
    const baseUrl = 'https://storage.googleapis.com/shm-public-assets/audio/';
    this.sounds = {
      click: new Audio(`${baseUrl}ui/click.ogg`),
      flip: new Audio(`${baseUrl}cards/card_flip.ogg`),
      match: new Audio(`${baseUrl}ui/positive_feedback.ogg`),
      error: new Audio(`${baseUrl}ui/negative_feedback.ogg`),
      victory: new Audio(`${baseUrl}celebration/tada.ogg`), 
      fanfare: new Audio(`${baseUrl}celebration/horns_fanfare.ogg`),
      combo: new Audio(`${baseUrl}ui/success.ogg`)
    };

    Object.values(this.sounds).forEach(audio => {
      audio.preload = 'auto';
      audio.volume = 0.9;
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
