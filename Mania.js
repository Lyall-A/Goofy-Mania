let globalSpeed = 1;

class Mania {
    constructor(map, difficulty, parent, settings) {
        this.map = map;
        this.difficulty = difficulty;
        this.parent = parent;
        this.settings = settings;

        this.sfx = {
            key: new Audio("sfx/key.ogg"),
            combobreak: new Audio("sfx/combobreak.ogg")
        };

        this.assets = {

        };

        points.forEach((point, index) => {
            if (point.asset) {
                this.assets[point.text] = document.createElement("img");
                this.assets[point.text].src = `assets/${point.asset}`;
            }
        });

        this.level = map.levels[difficulty];

        this.combo = 0;
        this.misses = 0;
        this.score = 0;
        // this.multiplier = 1;
        this.accuracy = 100.00;

        this.notesHitMissed = 0;

        this.maniaElement = document.createElement("div");
        this.maniaBackgroundElement = document.createElement("div");

        this.statsElement = document.createElement("div");
        this.notesElement = document.createElement("div");
        this.keysElement = document.createElement("div");

        this.comboElement = document.createElement("div");
        this.scoreElement = document.createElement("div");
        this.accuracyElement = document.createElement("div");

        this.scoreNameElement = document.createElement("div");

        this.maniaElement.id = "mania";
        this.maniaBackgroundElement.id = "mania-background";
        if (this.map.background) {
            this.maniaBackgroundImageElement = document.createElement("img");
            this.maniaBackgroundImageElement.src = `/maps/${this.map.dir}/${this.map.background}`;
            this.maniaBackgroundImageElement.width = "100%";
            this.maniaBackgroundElement.appendChild(this.maniaBackgroundImageElement);
        }

        this.statsElement.classList.add("stats");

        this.notesElement.id = "notes";

        this.keysElement.id = "keys";

        this.comboElement.id = "combo";
        this.comboElement.innerHTML = this.combo;

        this.scoreElement.id = "score";
        this.scoreElement.innerHTML = this.score;

        this.accuracyElement.id = "accuracy";
        this.accuracyElement.innerHTML = `${this.accuracy.toFixed(2)}%`;

        this.scoreNameElement.id = "score-name";
        this.scoreNameElement.style.display = "none";

        this.keys = [];
        this.keyKeybinds = [];

        for (let i = 0; i < this.level.keys; i++) {
            this.keys.push({});
            this.keyKeybinds.push(this.settings[`key${i + 1}Keybind`]?.toLowerCase());

            const rowElement = document.createElement("div");
            rowElement.classList.add("row");

            const keyElement = document.createElement("div");
            keyElement.classList.add("circle", "key");
            keyElement.innerHTML = this.keyKeybinds[i]?.toUpperCase() || "";

            this.keys[i].rowElement = rowElement;
            this.keys[i].keyElement = keyElement;

            this.notesElement.appendChild(rowElement);
            this.keysElement.appendChild(keyElement);
        }

        this.statsElement.appendChild(this.comboElement);
        this.statsElement.appendChild(this.scoreElement);
        this.statsElement.appendChild(this.accuracyElement);

        this.maniaElement.appendChild(this.statsElement);
        this.maniaElement.appendChild(this.notesElement);
        this.maniaElement.appendChild(this.keysElement);
        
        this.maniaElement.appendChild(this.scoreNameElement);

        this.parent.appendChild(this.maniaElement);
        this.parent.appendChild(this.maniaBackgroundElement);

        document.onkeydown = e => {
            const keyIndex = this.keyKeybinds.findIndex(i => i == e.key.toLowerCase());
            if (keyIndex == -1) return;
            // e.preventDefault();
            const key = this.keys[keyIndex];
            if (key.isDown) return;
            key.isDown = true;

            key.keyElement.classList.add("keydown");
            this.playSfx("key");

            const rowElement = key.rowElement;
            const notes = rowElement.getElementsByClassName("note");
            const note = notes.item(0);
            if (!note) return;

            const { y: noteY } = note.getBoundingClientRect();
            const { y: keyY } = key.keyElement.getBoundingClientRect();


            const early = keyY - noteY;
            const late = noteY - keyY;

            const distance = Math.max(early, late);

            let addedPoints = false;
            points.forEach(point => {
                if (!addedPoints && distance <= point.pixelDistance) {
                    addedPoints = true;
                    this.addPoints(point, early, late);
                    note.remove();
                    this.addCombo();
                }
            });
        }

        document.onkeyup = e => {
            const keyIndex = this.keyKeybinds.findIndex(i => i == e.key.toLowerCase());
            if (keyIndex == -1) return;
            // e.preventDefault();
            const key = this.keys[keyIndex];
            key.isDown = false;

            key.keyElement.classList.remove("keydown");
        }

        this.parent.style.display = "flex";
    }

    playSfx(sfx, volume = this.settings.sfxVolume) {
        const audio = this.sfx[sfx].cloneNode(true);
        audio.volume = (volume || 100) / 100;
        audio.onpause = e => e.preventDefault();
        return audio.play();
    }

    addPoints(point, early, late) {
        this.score += point.points;
        this.scoreElement.innerHTML = this.score;

        const clearScoreName = () => {
            this.scoreNameElement.style.display = "none";
            this.scoreNameElement.innerHTML = "";
        }

        clearTimeout(this.scoreNameTimeout);
        clearScoreName();

        setTimeout(() => {
            // NOTE: setTimeout to reset the font-size animation
            this.scoreNameElement.style.display = "flex";
            if (point.assetElement) {
                this.scoreNameElement.appendChild(point.assetElement);
            } else {
                this.scoreNameElement.innerHTML = `${point.text}`;
            }

            this.scoreNameTimeout = setTimeout(() => clearScoreName(), 150);
        });
    }

    updateAccuracy() {
        this.accuracy = (this.score / (points[0].points * this.notesHitMissed)) * 100;
        this.accuracyElement.innerHTML = `${this.accuracy.toFixed(2)}%`;
    }

    addCombo() {
        this.notesHitMissed++;
        this.combo++;
        this.comboElement.innerHTML = this.combo;
        this.updateAccuracy();
    }

    resetCombo() {
        if (!this.combo) return;
        this.combo = 0;
        this.comboElement.innerHTML = this.combo;
        this.playSfx("combobreak");
    }

    addMiss() {
        this.notesHitMissed++;
        this.resetCombo();
        this.updateAccuracy();
        // this.playSfx("miss.ogg");
    }

    spawnNote(row) {
        const rowElement = this.keys[row - 1].rowElement;
        const noteElement = document.createElement("div");

        noteElement.classList.add("circle", "note");

        let top = -120;
        noteElement.style.top = `${top}px`;

        this.gameLoop((deltaTime, nextFrame, fps) => {
            top += 1 * deltaTime * globalSpeed * ((this.settings.scrollSpeed || this.map.scrollSpeed) / 10);
            noteElement.style.top = `${top}px`;

            if (top >= rowElement.clientHeight + 120) {
                if (!rowElement.contains(noteElement)) return;
                this.addMiss();
                noteElement.remove();
            } else {
                nextFrame();
            }
        });

        rowElement.appendChild(noteElement);
    }

    spawnLongNote(row, length) {
        // TODO:
    }

    async start() {
        this.song = new Audio(`maps/${this.map.dir}/${this.map.song}`);
        this.song.volume = (this.settings.songVolume || 100) / 100;
        this.song.onpause = e => e.preventDefault();

        await this.song.play();

        setTimeout(() => {
            let currentBeat = 0;
            const getMapping = (index) => {
                const mapping = this.level.data[index];
                if (!mapping) return;

                setTimeout(() => {
                    currentBeat = mapping.beat;
                    mapping.notes.forEach((note, index) => {
                        if (note > 1) this.spawnLongNote(index + 1, note); else
                            if (note) this.spawnNote(index + 1);
                    });
                    getMapping(index + 1);
                }, ((mapping.beat - currentBeat) / this.map.bpm) * 60 * 1000);
            }

            getMapping(0);
        }, this.map.offset);

        // this.gameLoop((deltaTime, nextFrame, fps) => {
        //     console.log(fps, "FPS");
        //     nextFrame();
        // });

        this.song.onended = () => this.stop();

        if (this.onstart) this.onstart();
    }

    getCurrentBeat() {
        return (this.song.currentTime - this.map.offset) / (60 / this.map.bpm);
    }

    stop() {
        this.parent.style.display = "none";
        this.song.pause();
        this.song.remove();
        this.maniaElement.remove();
        this.maniaBackgroundElement.remove();
        // this.parent.innerHTML = "";
        if (this.onstop) this.onstop();
    }

    gameLoop(callback) {
        let prevTime;
        let fps = 0;

        const loop = () => {
            const time = Date.now();
            const deltaTime = time - (prevTime || time);
            if (deltaTime) fps = Math.round(1000 / deltaTime);
            prevTime = time;

            callback(deltaTime, () => requestAnimationFrame(loop), fps);
        }

        requestAnimationFrame(loop);
    }
}