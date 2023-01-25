

function personDragHandler(person){
    return function(ev){
        // ev.dataTransfer.setData("person", person);
        // ev.dataTransfer.setData("origin", person.spot);
        window.HANDLER_ORIGIN = person.spot;
        window.HANDLER_PERSON = person;
    }
}

class Person {
    constructor(name, id){
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


function dropHandler(spot_or_offstage){
    return function drop(ev) {
        ev.preventDefault();
        // var person = ev.dataTransfer.getData("person");
        // var origin = ev.dataTransfer.getData("origin");
        window.HANDLER_ORIGIN.removePerson(window.HANDLER_PERSON);
        spot_or_offstage.addPerson(window.HANDLER_PERSON);
      }
}

class OffStage {
    constructor(){
        this.el = document.createElement("div");
        this.el.id = "offstage";
        this.people = [];
        this.el.addEventListener("dragover", function(ev){ev.preventDefault()})
        this.el.addEventListener("drop", dropHandler(this))
    }

    addPerson(person){
        person.spot = this;
        this.people.push(person);
        this.el.append(person.el);
    }

    removePerson(person){
        this.people = this.people.filter(p => p.id != person.id);
        this.el.removeChild(person.el);
    }
}



class Spot {
    constructor(id){
        this.people = [];
        this.el = document.createElement("div");
        this.el.classList.add("spot")
        this.el.addEventListener("dragover", function(ev){ev.preventDefault()})
        this.el.addEventListener("drop", dropHandler(this))
    }

    addPerson(person){
        person.spot = this;
        this.people.push(person);
        this.el.appendChild(person.el);
    }

    removePerson(person){
        this.people = this.people.filter(p => p.id != person.id);
        this.el.removeChild(person.el);
    }
}


class Stage {
    constructor(height, width, id) {
      this.height = height;
      this.width = width;

      this.el = document.createElement("div");
      this.el.id = id;
      this.el.classList.add("stage");

      for(let r=0; r<this.height; r++){
        let row = document.createElement("div");
        row.classList.add("stage-row");
        row.id = `${id}-row-${r}`;
        for(let c=0; c<this.width; c++){
            row.append(new Spot(`spot-${r}-${c}`).el);
        }
        this.el.append(row);
      }
    }
}
  