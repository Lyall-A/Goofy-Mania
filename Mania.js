class Mania {
    constructor(map, difficulty, parent, settings) {
        this.map = map;
        this.difficulty = difficulty;
        this.parent = parent;
        this.settings = settings;

        this.combo = 0;
        this.misses = 0;
        this.points = 0;

        this.level = map.levels[difficulty];

        this.statsElement = document.createElement("div");
        this.comboElement = document.createElement("div");
        this.pointsElement = document.createElement("div");
        this.notesElement = document.createElement("div");
        this.keysElement = document.createElement("div");

        this.statsElement.classList.add("stats");

        this.comboElement.id = "combo";
        this.comboElement.innerHTML = "0";

        this.pointsElement.id = "points";
        this.pointsElement.innerHTML = "0";

        this.notesElement.id = "notes";

        this.keysElement.id = "keys";

        this.keys = [];
        this.keyKeybinds = [];

        for (let i = 0; i < this.level.keys; i++) {
            this.keys.push({ });
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
        this.statsElement.appendChild(this.pointsElement);

        this.parent.appendChild(this.statsElement);
        this.parent.appendChild(this.notesElement);
        this.parent.appendChild(this.keysElement);

        document.onkeydown = e => {
            const keyIndex = this.keyKeybinds.findIndex(i => i == e.key.toLowerCase());
            if (keyIndex == -1) return;
            const key = this.keys[keyIndex];
            if (key.isDown) return;
            key.isDown = true;

            key.keyElement.classList.add("keydown");
            this.playSfx("key.ogg");

            const rowElement = key.rowElement;
            const notes = rowElement.getElementsByClassName("note");
            const note = notes.item(0);
            if (!note) return;

            const { y: noteY } = note.getBoundingClientRect();
            const { y: keyY } = key.keyElement.getBoundingClientRect();

            const distance = Math.max(keyY - noteY, noteY - keyY);
            console.log(distance, noteY, keyY);

            let addedPoints = false;
            points.forEach(point => {
                if (!addedPoints && distance <= point.pixelDistance) {
                    addedPoints = true;
                    this.addPoints(point);
                    note.remove();
                    this.addCombo();
                }
            });
        }
        
        document.onkeyup = e => {
            const keyIndex = this.keyKeybinds.findIndex(i => i == e.key.toLowerCase());
            if (keyIndex == -1) return;
            const key = this.keys[keyIndex];
            key.isDown = false;

            key.keyElement.classList.remove("keydown");
        }

        this.parent.style.display = "flex";
    }

    playSfx(sfx, volume = this.settings.sfxVolume) {
        const audio = new Audio(`sfx/${sfx}`);
        audio.volume = (volume || 100) / 100;
        audio.onpause = e => e.preventDefault();
        return audio.play();
    }

    addPoints(point) {
        this.points += point.points;
        this.pointsElement.innerHTML = this.points;
    }

    addCombo() {
        this.combo++;
        this.comboElement.innerHTML = this.combo;
    }
    
    resetCombo() {
        if (!this.combo) return;
        this.combo = 0;
        this.comboElement.innerHTML = this.combo;
        this.playSfx("combobreak.ogg");
    }

    addMiss() {
        this.resetCombo();
        // this.playSfx("miss.ogg");
    }

    spawnNote(row) {
        const rowElement = this.keys[row - 1].rowElement;
        const noteElement = document.createElement("div");

        noteElement.classList.add("circle", "note");

        let top = -120;
        noteElement.style.top = `${top}px`;

        const scrollInterval = setInterval(() => {
            top += 1 * (this.settings.scrollSpeed || this.map.scrollSpeed / 2);
            noteElement.style.top = `${top}px`;
            if (top >= rowElement.clientHeight + 120) {
                clearInterval(scrollInterval);
                if (!rowElement.contains(noteElement)) return;
                this.addMiss();
                noteElement.remove();
            }
        });

        rowElement.appendChild(noteElement);
    }

    async start() {
        this.song = new Audio(`maps/${this.map.dir}/${this.map.song}`);
        this.song.volume = (this.settings.songVolume || 100) / 100;
        this.song.onpause = e => e.preventDefault();
        
        await this.song.play();

        let checkMapping;
        let nextMapping = 0;
        setTimeout(() => {
            checkMapping = setInterval(() => {
                this.currentBeat = (this.song.currentTime - this.map.offset) / (60 / this.map.bpm);

                const mapping = this.level.data[nextMapping];
                // if (!mapping) return clearInterval(checkMapping);
                if (!mapping) return;
                if (this.currentBeat >= (mapping.beat - this.map.beatDifference) && this.currentBeat <= (mapping.beat + this.map.beatDifference)) {
                    mapping.notes.forEach((note, index) => {
                        if (note) this.spawnNote(index + 1);
                    });
                    nextMapping++;
                }
            }, 10);

            this.song.onended = () => clearInterval(checkMapping);
        }, this.map.offset);
    }
}