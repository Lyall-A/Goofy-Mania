// TODO: sliders
// TODO: instead of spawning at the beat spawn before where it would be tapped at the beat instead

const settings = {
    key1Keybind: "d",
    key2Keybind: "f",
    key3Keybind: "j",
    key4Keybind: "k",
    sfxVolume: 15,
    songVolume: 50
};

const loading = document.getElementById("loading");
const mapSelect = document.getElementById("map-select");
const mapsList = document.getElementById("maps-list");
const difficultySelect = document.getElementById("difficulty-select");
const difficulties = document.getElementById("difficulties");
const game = document.getElementById("game");
// const mania = document.getElementById("mania");

points = points.sort((a, b) => a.pixelDistance - b.pixelDistance);
// points.forEach((point, index) => {
//     if (point.asset) {
//         points[index].assetElement = document.createElement("img");
//         points[index].assetElement.src = `assets/${point.asset}`;
//     }
// });

const maps = [];
loadMaps("666", "feral");

function loadMaps(...mapDirs) {
    (function loadMap(index) {
        const dir = mapDirs[index];
        if (!dir) {
            loading.style.display = "none";
            mapSelect.style.display = "flex";
            return;
        }
        const script = document.createElement("script");
        script.src = `maps/${dir}/map.js`;
        script.onload = () => {
            const map = maps[maps.length - 1];
            map.dir = dir;

            const button = document.createElement("div");
            button.onclick = () => selectMap(index);

            const coverImg = document.createElement("img");
            coverImg.src = `maps/${dir}/${map.cover}`;

            const title = document.createElement("span");
            title.innerHTML = `${map.name} - ${map.author} (${map.mappers.join(", ")})`

            button.appendChild(coverImg);
            button.appendChild(title);

            mapsList.appendChild(button);
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
    difficulties.innerHTML = "";
    selectedMap.levels.forEach((difficulty, difficultyIndex) => {
        const button = document.createElement("button");
        button.onclick = () => selectDifficulty(difficultyIndex);
        button.innerHTML = `${difficulty.name}`;
        difficulties.appendChild(button);
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
    game.style.display = "flex";
    maniaGame = new Mania(map, difficulty, game, settings);
    maniaGame.start();
    maniaGame.onstart = () => {
        if (record) {
            recordedData = [ ];

            document.onkeydown = e => {
                const keyIndex = maniaGame.keyKeybinds.findIndex(i => i == e.key.toLowerCase());
                if (keyIndex == -1) return;
                const notes = [0, 0, 0, 0];
                notes[keyIndex] = 1;
                recordedData.push({
                    beat: maniaGame.getCurrentBeat(),
                    notes
                });
            }
        }
    }
    maniaGame.onstop = () => {
        game.style.display = "none";
        mapSelect.style.display = "flex";
    }
}

let record = false;

function stopRecord() {
    if (!record) return;
    record = false;
    document.onkeydown = null;
    console.log(recordedData);
}