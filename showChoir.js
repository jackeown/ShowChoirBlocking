
function enableEdit(scene, titleEl) {
    return function () {
        console.log('enableEdit')
        titleEl.contentEditable = true;
        // titleEl.setAttribute("data-text", titleEl.innerText);
        scene.title = titleEl.innerText;
    }
}

function saveEdit(scene, titleEl) {
    return function () {
        console.log('saveEdit')
        scene.title = titleEl.innerText;
        // scene.title = titleEl.getAttribute("data-text");
        titleEl.contentEditable = false;
    }
}

function personDragHandler(person) {
    return function (ev) {
        // ev.dataTransfer.setData("person", person);
        // ev.dataTransfer.setData("origin", person.spot);
        window.HANDLER_ORIGIN = person.spot;
        window.HANDLER_PERSON = person;
    }
}

class Person {
    constructor(name, id, color, data) {
        this.id = id;
        this.name = name;
        this.data = data;
        this.spot = null;

        this.el = document.createElement("div");
        this.el.classList.add("person");
        this.el.draggable = true;
        this.el.style = `background:${color};`
        this.el.setAttribute('data-person-id', id);
        this.el.setAttribute('data-person-name', name);
        this.el.setAttribute('data-person-color', color);
        this.el.setAttribute('data-person-data', data);


        // this.el.innerText = name;
        // this.el.addEventListener('mouseover', function(e){alert(name);e.preventDefault();})
        // this.el.innerText = id;
        this.el.innerText = data;


        let personLabel = document.createElement("span");
        personLabel.classList.add("person_label");
        personLabel.innerText = name;
        this.el.appendChild(personLabel);

        this.el.addEventListener("dragstart", personDragHandler(this));
    }
    serialize() {
        return JSON.stringify({ name: this.name, id: this.id, color: this.color, data: this.data })
    }
    deserialize(str) {
        let { name, id, color, data } = JSON.parse(str)
        this.name = name;
        this.id = id;
        this.data = data;
        this.color = color;
        this.el.style = `background:${color};`
        this.el.setAttribute('data-person-id', id);
        this.el.setAttribute('data-person-name', name);
        this.el.setAttribute('data-person-data', data);

        this.el.innerText = data;
    }
    clone() {
        let { name, id, color, data } = JSON.parse(this.serialize())
        return new Person(name, id, color, data)
    }
}


function dropHandler(spot_or_offstage) {
    return function drop(ev) {
        ev.preventDefault();
        // var person = ev.dataTransfer.getData("person");
        // var origin = ev.dataTransfer.getData("origin");
        window.HANDLER_ORIGIN.removePerson(window.HANDLER_PERSON);
        spot_or_offstage.addPerson(window.HANDLER_PERSON);
    }
}

class OffStage {
    constructor() {
        this.el = document.createElement("div");
        this.el.id = "offstage";
        this.people = [];
        this.el.addEventListener("dragover", function (ev) { ev.preventDefault() })
        this.el.addEventListener("drop", dropHandler(this))
    }

    addPerson(person) {
        person.spot = this;
        this.people.push(person);
        this.el.append(person.el);
    }

    removePerson(person) {
        this.people = this.people.filter(p => p.id != person.id);
        this.el.removeChild(person.el);
    }
}



class Spot {
    constructor(id) {
        this.people = [];
        this.el = document.createElement("div");
        this.el.classList.add("spot")
        this.el.addEventListener("dragover", function (ev) { ev.preventDefault() })
        this.el.addEventListener("dragenter", function (ev) { ev.preventDefault() })

        this.el.addEventListener("drop", dropHandler(this))
    }

    addPerson(person) {
        person.spot = this;
        this.people.push(person);
        this.el.appendChild(person.el);
    }

    removePerson(person) {
        this.people = this.people.filter(p => p.id != person.id);
        this.el.removeChild(person.el);
    }
}


class Stage {
    constructor(height, width, id, numberLineRange) {
        this.height = height;
        this.width = width;
        this.id = id;
        this.el = document.createElement("div");
        this.el.id = id;
        this.el.classList.add("stage");
        this.spots = [];
        this.numberLineRange = numberLineRange;
        for (let r = 0; r < this.height; r++) {
            let row = document.createElement("div");
            row.classList.add("stage-row");
            row.classList.add(`stage-${id}-row`)
            row.id = `stage-${id}-row-${r}`;
            row.style = `height: calc(100%/${height});`
            for (let c = 0; c < this.width; c++) {
                let spot = new Spot(`stage-${id}-spot-${r}-${c}`);
                this.spots.push(spot)
                spot.el.style = `width: calc(100%/${width});`
                row.append(spot.el);
            }
            this.el.append(row);
        }
        this.numberLineDiv = document.createElement("div");
        this.numberLineDiv.style = "display: flex; justify-content:space-around;"
        if (!(numberLineRange === undefined)) {
            for (let i = -numberLineRange; i <= numberLineRange; i++) {
                let d = document.createElement("div")
                d.id = `number-${i}`
                // d.style = "margin:0px;padding:0px;display:flex;justify-content:center;align-items:center;width:"
                d.innerText = Math.abs(i)
                this.numberLineDiv.appendChild(d)
            }
            this.el.append(this.numberLineDiv)
        }
    }

    serialize() {
        let rows = Array.from(this.el.querySelectorAll(`.stage-${this.id}-row`));
        // console.log(rows)
        let stageState = [];
        for (let row of rows) {
            let rowState = [];
            for (let spot of Array.from(row.querySelectorAll(`.spot`))) {
                let persons = Array.from(spot.querySelectorAll(`.person`));
                //I'd like to do this:
                // rowState.push(persons.map(person => person.serialize()))
                rowState.push(persons.map(function (x) {
                    return {
                        name: x.getAttribute('data-person-name'),
                        id: x.getAttribute('data-person-id'),
                        color: x.getAttribute('data-person-color'),
                        data: x.getAttribute('data-person-data'),

                    }
                }))
            }
            stageState.push(rowState);
        }
        return JSON.stringify(stageState)
    }
    deserialize(state) {
        state = JSON.parse(state);
        for (let [i, row] of state.entries()) {
            for (let [j, col] of row.entries()) {
                // console.log(i,j)
                let spot = this.spots[i * row.length + j];
                for (let person of spot.people) {
                    spot.removePerson(person);
                }
                for (let personRep of col) {
                    //I'd like to be able to have a handle on the person instead of creating new
                    let person = new Person(personRep.name, personRep.id, personRep.color, personRep.data)
                    spot.addPerson(person)
                }
            }
        }
    }
    addPerson(person) {
        let i = Math.floor(this.spots.length / 2);
        let j = 0;
        // let gen = findGenerator(this.spots.length)
        // console.log(this.spots.length)
        // console.log(gen)
        while (this.spots[i].people.length > j) {
            if (i >= this.spots.length - 1) {
                j++
            }
            i += 2
            i %= this.spots.length
        }
        this.spots[i].addPerson(person)
    }
    removePerson(person) {
        for (let spot of this.spots) {
            spot.removePerson(person);
        }
    }
    clone(newId) {
        let s = this.serialize()
        let state = JSON.parse(s);
        let m = state.length;
        let n = state[0].length;
        let newStage = new Stage(m, n, newId, this.numberLineRange)
        for (let [i, row] of state.entries()) {
            for (let [j, col] of row.entries()) {
                // console.log(i,j)
                let spot = newStage.spots[i * row.length + j];
                for (let personRep of col) {
                    let person = new Person(personRep.name, personRep.id, personRep.color, personRep.data)
                    spot.addPerson(person)
                }
            }
        }
        return newStage

    }
}

class Scene {
    constructor(stages, title, id) {
        this.stages = stages;
        this.title = title;
        this.el = document.createElement("div");
        this.el.id = id
        this.el.classList.add("scene");
        let titleEl = document.createElement("h1");
        this.titleEl = titleEl;
        // titleEl.addEventListener("click", function(){
        //     var newText = prompt("Enter new text:");
        //     titleEl.innerHTML = newText;
        // });
        let ee = enableEdit(this, this.titleEl);
        let se = saveEdit(this, this.titleEl);
        titleEl.addEventListener("focus", ee);
        titleEl.addEventListener("click", ee);
        titleEl.addEventListener("blur", se);
        titleEl.innerText = title;
        this.el.appendChild(titleEl);
        let stagesDiv = document.createElement("div");
        stagesDiv.classList.add("stages-list")
        for (let stage of stages) {
            stagesDiv.appendChild(stage.el)
        }
        this.el.appendChild(stagesDiv);
    }
    serialize() {
        return JSON.stringify({
            title: this.title,
            stages: this.stages.map(x => x.serialize()),
            id: this.id
        })
    }
    deserialize(str) {
        let { title, stages, id } = JSON.parse(str)
        this.title = title;
        this.titleEl.innerText = title;
        stages.forEach((x, i) => this.stages[i].deserialize(x))
        this.id = id
    }
    clone() {
        let clonedStages = this.stages.map(x => x.clone(`scene-${this.id}-stage-${x.id}`))
        let newScene = new Scene(clonedStages, `cloned ${this.title}`, 'asdf')
        return newScene
    }
}

class Song {
    constructor(scenes, title, id) {
        this.scenes = scenes;
        this.title = title;
        this.id = id;
        this.currentSceneIndex = 0;
        this.el = document.createElement('div')
        this.el.id = this.id;
        this.el.appendChild(scenes[this.currentSceneIndex].el);
    }
    serialize() {
        return JSON.stringify({
            title: this.title,
            scenes: this.scenes.map(x => x.serialize()),
            id: this.id
        })
    }
    deserialize(str) {
        let { title, scenes, id } = JSON.parse(str)
        this.title = title;
        this.titleEl.innerText = title;
        scenes.forEach((x, i) => this.scenes[i].deserialize(x))
        this.id = id;
    }
    setCurrentScene(currentSceneIndex){
        this.el.removeChild(this.scenes[this.currentSceneIndex].el)
        this.currentSceneIndex = currentSceneIndex;
        this.el.appendChild(this.scenes[this.currentSceneIndex].el);
    }

}