

function personDragHandler(person) {
    return function (ev) {
        // ev.dataTransfer.setData("person", person);
        // ev.dataTransfer.setData("origin", person.spot);
        window.HANDLER_ORIGIN = person.spot;
        window.HANDLER_PERSON = person;
    }
}

class Person {
    constructor(name, id) {
        this.id = id;
        this.name = name;
        this.spot = null;

        this.el = document.createElement("div");
        this.el.classList.add("person");
        this.el.draggable = true;
        this.el.id = id;
        this.el.innerText = name;
        this.el.addEventListener("dragstart", personDragHandler(this));
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
    constructor(height, width, id) {
        this.height = height;
        this.width = width;
        this.id = id;
        this.el = document.createElement("div");
        this.el.id = id;
        this.el.classList.add("stage");
        this.spots = [];

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
    }

    serialize() {
        let rows = Array.from(document.querySelectorAll(`.stage-${this.id}-row`));
        // console.log(rows)
        let stageState = [];
        for (let row of rows) {
            let rowState = [];
            for (let spot of Array.from(row.querySelectorAll(`.spot`))) {
                let persons = Array.from(spot.querySelectorAll(`.person`));
                rowState.push(persons.map(function (x) { return { name: x.innerHTML, id: x.id } }))
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
                for(let person of spot.people){
                    spot.removePerson(person);
                }
                for (let personRep of col) {
                    let person = new Person(personRep.name, personRep.id)
                    spot.addPerson(person)
                }
            }
        }
    }
    addPerson(person) {
        let i = Math.floor(this.spots.length/2);
        let j = 0;
        // let gen = findGenerator(this.spots.length)
        // console.log(this.spots.length)
        // console.log(gen)
        while (this.spots[i].people.length > j) {
            if (i >= this.spots.length-1) {
                j++
            }
            i+= 2
            i %= this.spots.length
        }
        this.spots[i].addPerson(person)
    }
    removePerson(person){
        for(let spot of this.spots){
            spot.removePerson(person);
        }
    }
}

class Scene{
    constructor(Stages, title, id){
        this.Stages = Stages;
        this.title = title;
        this.el = document.createElement("div");
        this.el.id = id
        this.el.classList.add("scene");
        let titleEl = document.createElement("h1");
        titleEl.innerText=title;
        this.el.appendChild(titleEl);
        let stagesDiv = document.createElement("div");
        stagesDiv.classList.add("stages-list")
        for(let stage of Stages){
            stagesDiv.appendChild(stage.el)
        }
        this.el.appendChild(stagesDiv);
    }
    serialize(){
        return this.Stages.map(x => x.serialize())
    }
    deserialize(str){
        str.forEach((x,i) => this.Stages[i].deserialize(x))
    }
}