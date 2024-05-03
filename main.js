const settings = {
    key1Keybind: "d",
    key2Keybind: "f",
    key3Keybind: "j",
    key4Keybind: "k",
    sfxVolume: 25,
    songVolume: 50
};

const loading = document.getElementById("loading");
const mapSelect = document.getElementById("map-select");
const difficultySelect = document.getElementById("difficulty-select");
const mania = document.getElementById("mania");

points = points.sort((a, b) => a.pixelDistance - b.pixelDistance);

const maps = [];
loadMaps("666.js", "feral.js");

function loadMaps(...mapFiles) {
    (function loadMap(index) {
        const file = mapFiles[index];
        if (!file) {
            loading.style.display = "none";
            mapSelect.style.display = "flex";
            return;
        }
        const script = document.createElement("script");
        script.src = `maps/${file}`;
        script.onload = () => {
            const map = maps[maps.length - 1];
            const button = document.createElement("button");
            button.onclick = () => selectMap(index);
            button.innerHTML = `${map.name} - ${map.author} (${map.mappers.join(", ")})`;
            mapSelect.appendChild(button);
            loadMap(index+1);
        }
        document.head.appendChild(script);
    })(0);
}

let selectedMap;
let selectedDifficulty;

function selectMap(mapIndex) {
    const map = maps[mapIndex];
    if (!map) return;
    selectedMap = map;
    selectedMap.levels.forEach((difficulty, difficultyIndex) => {
        const button = document.createElement("button");
            button.onclick = () => selectDifficulty(difficultyIndex);
            button.innerHTML = `${difficulty.name}`;
            difficultySelect.appendChild(button);
    });
    mapSelect.style.display = "none";
    difficultySelect.style.display = "flex";
}

function selectDifficulty(difficultyIndex) {
    const level = selectedMap.levels[difficultyIndex]
    if (!level) return;
    selectedDifficulty = difficultyIndex;
    difficultySelect.style.display = "none";
    startLevel(selectedMap, selectedDifficulty);
}

function startLevel(map, difficulty) {
    game = new Mania(map, difficulty, mania, settings);
    game.start();
}

function record() {
    console.log("SADA");
    if (i == true) {
        console.log(data);
        return;
    }
    i = true;
    document.onkeydown = e => {
        const keyIndex = game.keyKeybinds.findIndex(i => i == e.key.toLowerCase());
        if (keyIndex == -1) return;
        const notes = [false, false, false, false];
        notes[keyIndex] = true;
        data.push({
            beat: game.currentBeat,
            notes
        })
    }
}