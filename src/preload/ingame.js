const {clipboard, ipcRenderer} = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const settings = new Store();

const documents = ipcRenderer.sendSync('docs');
let scriptFolder = documents + "\\BetterKirkaClient\\scripts";

if (!fs.existsSync(scriptFolder)) {
    fs.mkdirSync(scriptFolder, {recursive: true});
}
try {
    fs.readdirSync(scriptFolder).filter(file => path.extname(file).toLowerCase() === '.js').forEach(filename => {
        try {
            require(`${scriptFolder}/${filename}`);
        } catch (e) {
            console.error("an error occurred while executing userscript: " + filename + " error: " + e);
        }
    });
} catch (e) {
    console.error("an error occurred while loading userscripts: " + e);
}

let permCrosshair = !!settings.get('permCrosshair');
let noLoadingTimes = true;
let customCss = !!settings.get('customCss');
let hpNumber = true;
let hideWeaponsAds = !!settings.get('hideWeaponsAds');
let hideArms = !!settings.get('hideArms');
let playerHighLight = !!settings.get('playerHighLight');
let fullBlack = !!settings.get('fullBlack');
let wireframe = !!settings.get('wireframe');
let rainbow = !!settings.get('rainbow');

let inspecting = false;
let prevInsp = false;
let prevInspectPos;
let prevInspectRot;

let prevWireframe = false;

let gui = document.createElement("div");
let menuVisible = false;

let listening = false;
if (!settings.get('inspectKey')) settings.set('inspectKey', "j");

let scene;

WeakMap.prototype.set = new Proxy(WeakMap.prototype.set, {
    apply(target, thisArg, argArray) {

        if (argArray[0] && argArray[0].type === 'Scene' && argArray[0].children[0].type === 'AmbientLight') {
            console.log(...arguments);
            scene = argArray[0];
        }

        return Reflect.apply(...arguments);
    }
});

let crosshair;

new MutationObserver(mutationRecords => {
    try {
        mutationRecords.forEach(record => {
            record.addedNodes.forEach(el => {
                if (el.classList?.contains("loading-scene") && noLoadingTimes) el.parentNode.removeChild(el);
                if (el.id === "qc-cmp2-container") el.parentNode.removeChild(el);
                if (el.id === "cmpPersistentLink" || el.classList?.contains("home")) {

                    let btn = document.createElement("button");

                    btn.id = "clientJoinButton";

                    btn.style = "background-color: var(--primary-1);\n" +
                        "    --hover-color: var(--primary-2);\n" +
                        "    --top: var(--primary-2);\n" +
                        "    --bottom: var(--primary-3);" +
                        "    display: flex;\n" +
                        "    justify-content: center;\n" +
                        "    align-items: center;\n" +
                        "    border: none;\n" +
                        "    position: absolute;\n" +
                        "    color: var(--white);\n" +
                        "    font-size: 1rem;\n" +
                        "    transition: all .3s ease;\n" +
                        "    font-family: Rowdies;\n" +
                        "    padding: .9em 1.4em;\n" +
                        "    transform: skew(-10deg);\n" +
                        "    font-weight: 900;\n" +
                        "    overflow: hidden;\n" +
                        "    text-transform: uppercase;\n" +
                        "    border-radius: .2em;\n" +
                        "    outline: none;\n" +
                        "    text-shadow: 0 0.1em 0 #000;\n" +
                        "    -webkit-text-stroke: 1px var(--black);\n" +
                        "    box-shadow: 0 0.15rem 0 rgba(0,0,0,.315);\n" +
                        "    cursor: pointer;" +
                        "    box-shadow: 0 5.47651px 0 rgba(0,0,0,.5)!important;\n" +
                        "    text-shadow: -1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000,0 1px 1px rgba(0,0,0,.486)!important;" +
                        "    width: 150px;" +
                        "    height: 50px;" +
                        "    bottom: 0px;" +
                        "    right: 100%;" +
                        "    margin-right: 10px;" +
                        "    font-size: 20px;";


                    btn.innerText = "use Join Link";

                    btn.onclick = () => {
                        window.open(clipboard.readText());
                    }

                    document.getElementsByClassName('play-content')[0].append(btn);

                    document.getElementsByClassName('settings-and-socicons')[0].children[1].onclick = () => {
                        window.open("https://www.youtube.com/watch?v=Vmf5evAwScc");
                    };

                    if (!el.classList?.contains("home")) el.parentNode.removeChild(el);

                }
                if (el.classList?.contains("game-interface")) {
                    crosshair = document.getElementById("crosshair-static");
                    let hpElem = document.getElementsByClassName("hp-progress")[0];
                    document.getElementsByClassName('hp-title')[0].innerText = hpElem.style.width.slice(0, -1);
                    observer.observe(hpElem, {
                        attributeFilter: ["style"],
                    });
                }
            });
        });
    } catch {
    }
}).observe(document, {childList: true, subtree: true});


let oldLog = console.log;

console.log = (...arguments) => {
    if (typeof arguments[0] == "string" && arguments[0].includes("refresh") && arguments[0].includes("ad") && !arguments[0].includes("added")) {
        throw "ad's blocked by overengineered ad block " + Math.random().toString().split(".")[1];
    }
    oldLog(...arguments);
};


document.addEventListener("DOMContentLoaded", () => {

    if (customCss) {
        let cssLinkElem = document.createElement("link");
        cssLinkElem.href = settings.get('cssLink');
        cssLinkElem.rel = "stylesheet";
        document.head.append(cssLinkElem);
    }

    gui.id = "gui";

    gui.innerHTML += "<style>\n" +
        "       @import url('https://poopooumgoodttv.github.io/Reverie-clan-Manager/kirka/themes/old/Reverie/new/clan/kirka.theme/what-a-url.css');" +
        "        #gui {\n" +
        "            background-color: rgb(24,25,28);\n" +
        "            border: solid rgb(24,25,28) 5px;\n" +
        "            box-shadow: 0 0 8px 2px #000000;\n" +
        "            position: absolute;\n" +
        "            left: 200px;\n" +
        "            top: 260px;\n" +
        "            z-index: 300;\n" +
        "            color: rgb(255, 255, 255);\n" +
        "            padding: 6px;\n" +
        "            font-family: \"Titillium Web\", serif;\n" +
        "            line-height: 1.6;\n" +
        "            border-radius: 3px" +
        "        }\n" +
        "\n" +
        "        input:disabled {\n" +
        "            background: rgb(255, 255, 255);\n" +
        "            border: solid rgb(0, 0, 0) 1px;\n" +
        "            width: 50px;\n" +
        "        }\n" +
        "\n" +
        "        .heading {\n" +
        "            width: 300px;\n" +
        "            height: 40px;\n" +
        "            display: flex;\n" +
        "            justify-content: center;\n" +
        "            align-items: center;\n" +
        "            background-color: rgb(24,25,28);\n" +
        "            margin: -9px -6px 8px;\n" +
        "            font-family: \"Titillium Web\", serif;\n" +
        "            font-weight: bold;\n" +
        "            text-align: center;\n" +
        "            font-size: 24px;\n" +
        "            border-bottom: solid rgb(140,140,140) 2px;" +
        "        }\n" +
        "\n" +
        "        .footer {\n" +
        "            width: 300px;\n" +
        "            height: 20px;\n" +
        "            display: flex;\n" +
        "            justify-content: center;\n" +
        "            align-items: center;\n" +
        "            background-color: rgb(24,25,28);\n" +
        "            margin: 6px -6px -10px;\n" +
        "            font-family: \"Titillium Web\", serif;\n" +
        "            font-weight: bold;\n" +
        "            text-align: center;\n" +
        "            font-size: 11px;\n" +
        "            position: relative;\n" +
        "            border-top: solid rgb(140,140,140) 2px;" +
        "        }\n" +
        "\n" +
        "        .module:hover {\n" +
        "            background-color: rgb(0, 0, 0, 0.1)\n" +
        "        }\n" +
        "\n" +
        "\n" +
        "    </style>\n" +
        "    <div id=\"infi\" class=\"heading\">Client Settings</div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"crosshair\" name=\"crosshair\">\n" +
        "        <label for=\"crosshair\">Perm. Crosshair</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"customCSS\" name=\"customCSS\">\n" +
        "        <label for=\"customCSS\">CSS Link: </label>\n" +
        "        <input type=\"text\" id=\"cssLink\" placeholder='Paste CSS Link Here'>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"hideweap\" name=\"hideweap\">\n" +
        "        <label for=\"hideweap\">Hide Weapon ADS</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"arms\" name=\"arms\">\n" +
        "        <label for=\"arms\">Hide Arms</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"highlight\" name=\"highlight\">\n" +
        "        <label for=\"highlight\">Highlight Players</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"black\" name=\"black\">\n" +
        "        <label for=\"black\">Black Players</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"wireframe\" name=\"wireframe\">\n" +
        "        <label for=\"wireframe\">Wireframe Models</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        <input type=\"checkbox\" id=\"rainbow\" name=\"rainbow\">\n" +
        "        <label for=\"rainbow\">Rainbow Colors</label>\n" +
        "    </div>\n" +
        "\n" +
        "    <div class=\"module\">\n" +
        "        Inspect Key <button id='bindButton' style=\"width: 100px\">click to bind</button>\n" +
        "    </div>\n" +
        "\n" +
        "\n" +
        "    <div class=\"footer\">Toggle With \"PageUp\" Key</div>";


    gui.onclick = (e) => {

        if (e.target.id === "crosshair") {
            permCrosshair = e.target.checked;
            settings.set('permCrosshair', permCrosshair);
        }

        if (e.target.id === "customCSS") {
            customCss = e.target.checked;
            settings.set('customCss', customCss);
        }

        if (e.target.id === "hideweap") {
            hideWeaponsAds = e.target.checked;
            settings.set('hideWeaponsAds', hideWeaponsAds);
        }

        if (e.target.id === "arms") {
            hideArms = e.target.checked;
            settings.set('hideArms', hideArms);
        }

        if (e.target.id === "highlight") {
            playerHighLight = e.target.checked;
            settings.set('playerHighLight', playerHighLight);
        }

        if (e.target.id === "black") {
            fullBlack = e.target.checked;
            settings.set('fullBlack', fullBlack);
        }

        if (e.target.id === "wireframe") {
            wireframe = e.target.checked;
            settings.set('wireframe', wireframe);
        }

        if (e.target.id === "rainbow") {
            rainbow = e.target.checked;
            settings.set('rainbow', rainbow);
        }

    };

    gui.style.display = "none";

    document.body.appendChild(gui);

    if (settings.get('menuOpen') === undefined || settings.get('menuOpen')) {
        toggleGui();
    }

    document.getElementById("crosshair").checked = permCrosshair;
    document.getElementById("customCSS").checked = customCss;
    document.getElementById("hideweap").checked = hideWeaponsAds;
    document.getElementById("arms").checked = hideArms;
    document.getElementById("highlight").checked = playerHighLight;
    document.getElementById("black").checked = fullBlack;
    document.getElementById("wireframe").checked = wireframe;
    document.getElementById("rainbow").checked = rainbow;

    let button = document.getElementById("bindButton");
    button.style.fontWeight = "800";
    button.onclick = () => {
        listening = true;
        button.innerText = "Press a Key"
    }

    button.innerText = settings.get('inspectKey').toUpperCase();

    let cssField = document.getElementById('cssLink');

    if (settings.get('cssLink') === undefined) settings.set('cssLink', '');

    cssField.value = settings.get('cssLink');

    cssField.oninput = () => {
        settings.set('cssLink', cssField.value);
    }

});

window.addEventListener("mouseup", (e) => {
    if (e.button === 3 || e.button === 4)
        e.preventDefault();
});

const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        document.getElementsByClassName('hp-title')[0].innerText = hpNumber ? mutation.target.style.width.slice(0, -1) : "HP";
    });
});

let scoped = false;

document.addEventListener('mousedown', (e) => {
    if (e.button === 2) scoped = true;
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 2) scoped = false;
});

let inspectedWeapon;

document.addEventListener('keydown', (e) => {

    if (listening) {
        settings.set('inspectKey', e.key);
        document.getElementById("bindButton").innerText = e.key.toUpperCase();
        listening = false;
    }

    if (e.key === settings.get("inspectKey").toLowerCase()) {
        inspecting = true;
        setTimeout(() => {
            inspecting = false
        }, 3000);
    }

    if (e.code === "PageUp") {
        toggleGui();
    }

});

let r = 255;
let g = 0;
let b = 0;

function animate() {
    window.requestAnimationFrame(animate);
    if (rainbow) {
        if (r > 0 && b === 0) {
            r--;
            g++;
        }
        if (g > 0 && r === 0) {
            g--;
            b++;
        }
        if (b > 0 && g === 0) {
            r++;
            b--;
        }
    } else {
        let color = hexToRgb("#ff0000");
        r = color.r;
        g = color.g;
        b = color.b;
    }

    if (crosshair && permCrosshair) crosshair.style = "visibility: visible !important; opacity: 1 !important; display: block !important;"


    //just to remind you, your client has to be open source if you want to use stuff from here :)
    //@AwesomeSam
    try {

        let weap = document.getElementsByClassName('list-weapons')[0].children[0].children[0].innerText;
        let num = 4;

        if (weap === "Weatie" || weap === "MAC-10") num = 5;

        if (weap === "AR-9") num = 3;

        let arms = true;
        if ((scoped && hideWeaponsAds) || hideArms) {
            arms = false;
        }

        const weaponModel = scene["entity"]["_entityManager"]["mWnwM"]["systemManager"]["_systems"]["0"]["_queries"]["player"]["entities"]["0"]["_components"]["35"]["weapons"][weap]["model"];
        const armsMaterial = weaponModel["parent"]["children"]["0"]["material"];
        const weaponMaterial = weaponModel["children"][num]["material"];

        armsMaterial.visible = arms;

        if (hideWeaponsAds) weaponMaterial.visible = !scoped;

        if (inspecting) {
            if (!prevInsp) {
                prevInspectPos = weaponModel.position.clone();
                prevInspectRot = weaponModel.rotation.clone();
                if(weaponModel) inspectedWeapon = weaponModel;
            }
            weaponModel.rotation.x = 0;
            weaponModel.rotation.y = -0.3;
            weaponModel.rotation.z = -0.4;

            weaponModel.position.y = 0.05;
            weaponModel.position.z = -0.08;
        } else {
            if (prevInsp) {
                inspectedWeapon.rotation.x = prevInspectRot.x;
                inspectedWeapon.rotation.y = prevInspectRot.y;
                inspectedWeapon.rotation.z = prevInspectRot.z;

                inspectedWeapon.position.y = prevInspectPos.y;
                inspectedWeapon.position.z = prevInspectPos.z;
            }
        }

        prevInsp = inspecting;

        if (wireframe) {
            armsMaterial.wireframe = true;
            armsMaterial.color.r = r / 255;
            armsMaterial.color.g = g / 255;
            armsMaterial.color.b = b / 255;
            armsMaterial.emissive.r = r / 255;
            armsMaterial.emissive.g = g / 255;
            armsMaterial.emissive.b = b / 255;

            weaponMaterial.wireframe = true;
            weaponMaterial.color.r = r / 255;
            weaponMaterial.color.g = g / 255;
            weaponMaterial.color.b = b / 255;
            weaponMaterial.emissive.r = r / 255;
            weaponMaterial.emissive.g = g / 255;
            weaponMaterial.emissive.b = b / 255;
        } else {
            if (prevWireframe) {
                armsMaterial.wireframe = false;
                armsMaterial.color.r = 1;
                armsMaterial.color.g = 1;
                armsMaterial.color.b = 1;
                armsMaterial.emissive.r = 0;
                armsMaterial.emissive.g = 0;
                armsMaterial.emissive.b = 0;


                weaponMaterial.wireframe = false;
                weaponMaterial.color.r = 1;
                weaponMaterial.color.g = 1;
                weaponMaterial.color.b = 1;
                weaponMaterial.emissive.r = 0;
                weaponMaterial.emissive.g = 0;
                weaponMaterial.emissive.b = 0;
            }
        }

        prevWireframe = wireframe;

    } catch {
    }
    try {
        for (let i = 0; i < scene["entity"]["_entityManager"]["mWnwM"]["systemManager"]["_systems"]["2"]["_queries"]["animationEntities"]["entities"].length; i++) {

            let localPlayerClass = scene["children"]["0"]["parent"]["entity"]["_entityManager"]["mWnwM"]["systemManager"]["_systems"]["0"]["_queries"]["player"]["entities"]["0"]["_components"]["38"].wnWmN;
            let player = scene["entity"]["_entityManager"]["mWnwM"]["systemManager"]["_systems"]["2"]["_queries"]["animationEntities"]["entities"][i]["_components"];
            let mat = scene["entity"]["_entityManager"]["mWnwM"]["systemManager"]["_systems"]["2"]["_queries"]["animationEntities"]["entities"][i]["_components"][0].value.children[0].children[0].children[1].material;

            if ((mat.color.r === 1 && mat.color.g < 1 && mat.color.b < 1) || !playerHighLight) continue;

            let color = hexToRgb("#0000ff");
            if (!localPlayerClass.team || localPlayerClass.team !== player["50"].team) {
                color = hexToRgb("#ff0000");
                if (fullBlack) color = hexToRgb('#000000')
            }

            let r = color.r * Number.MAX_SAFE_INTEGER;
            let g = color.g * Number.MAX_SAFE_INTEGER;
            let b = color.b * Number.MAX_SAFE_INTEGER;

            mat.map = null;
            mat.color.r = r;
            mat.color.g = g;
            mat.color.b = b;

            mat.needsUpdate = true;

        }
    } catch {
    }

}

animate();

//just to remind you, your client has to be open source if you want to use stuff from here :)
XMLHttpRequest = class extends XMLHttpRequest {

    constructor() {
        super();

        this.send = (...sendArgs) => {
            let oldChange = this.onreadystatechange;
            this.onreadystatechange = (...args) => {
                if (this.responseURL === "https://api.kirka.io/api/inventory") {
                    if (this.response.length > 0) {
                        let entries = JSON.parse(this.response);
                        let sortedItems = {legendary: [], epic: [], rare: [], common: []};

                        for (let entry of entries) {
                            sortedItems[entry.item.rarity.toLowerCase()].push(entry);
                        }

                        let editEntries = [];
                        for (let rarity in sortedItems) {
                            editEntries = [].concat(editEntries, sortedItems[rarity]);
                        }

                        Object.defineProperty(this, 'responseText', {
                            writable: true,
                            value: editEntries
                        });
                    }
                }
                oldChange && oldChange.apply(this, ...args);
            };

            super.send(...sendArgs);
        };

    }

}

function toggleGui() {
    menuVisible = !menuVisible;
    if (menuVisible) {
        document.exitPointerLock();
        gui.style.display = 'inline-block';
    } else {
        gui.style.display = 'none';
    }
    settings.set('menuOpen', menuVisible);
}

function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
