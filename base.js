var paused = true;
var nr_of_precomputes = 5000;
var dt = 0.001;
var G = 1;
var eps = 0.05;

canvas = document.getElementById("canvas");
var W = canvas.width;
canvas.height = canvas.width;
var H = canvas.height;

// canvas.style.width = displayWidth + 'px';
// canvas.style.height = displayHeight + 'px';
// canvas.width = displayWidth * scale;
// canvas.height = displayHeight * scale;

// let scale = 4;
// canvas.style.width = "100px";
// canvas.width = "1000px";
// canvas.style.height = canvas.style.width;
// W = canvas.style.width;
// canvas.width = W * scale;
// canvas.height = W * scale;

ctx = canvas.getContext("2d");
ctx.fillStyle = "white";
ctx.strokeStyle = "white";
ctx.lineWidth = 1;

function trf(x, y) {
    x = (1.1 + x) * W / 2.2;
    y = (1.1 - y) * H / 2.2;
    return [x, y]
}
function draw_circle(X, Y, r) {
    let [x, y] = trf(X, Y);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.fill();
}
function draw_line(X_i, Y_i, X_f, Y_f) {
    let [x_i, y_i] = trf(X_i, Y_i);
    let [x_f, y_f] = trf(X_f, Y_f);
    ctx.beginPath();
    ctx.moveTo(x_i, y_i);
    ctx.lineTo(x_f, y_f);
    ctx.strokeStyle = "white";
    ctx.stroke();
}

class Planet {
    constructor(m, x, y, u, v) {
        this.m = m;
        this.x = x;
        this.y = y;
        this.u = u;
        this.v = v;
    }
    forward() {
        let state = [this.x, this.y, this.u, this.v];
        state = euler(state, bodies);
        this.x = state[0];
        this.y = state[1];
        this.u = state[2];
        this.v = state[3];
    }
    render() {
        let x = this.x;
        let y = this.y
        let r = this.m * 5;
        draw_circle(x, y, r);
    }
}

class Universe {
    constructor(sun, planets, rocket) {
        this.sun = sun;
        this.planets = planets;
        this.rocket = rocket;
    }
    forward() {
        for (let i = 0; i < planets.length; i++) {
            this.planets[i].forward();
        }
        this.rocket.forward();
    }
    render() {
        sun.render();
        for (let i = 0; i < planets.length; i++) {
            this.planets[i].render();
        }
        this.rocket.render();
    }
}

class Rocket {
    constructor(x, y, u, v) {
        this.x = x;
        this.y = y;
        this.u = u;
        this.v = v;
    }
    forward() {
        let state = [this.x, this.y, this.u, this.v];
        state = euler(state, bodies);
        this.x = state[0];
        this.y = state[1];
        this.u = state[2];
        this.v = state[3];
    }
    render() {
        let x = this.x;
        let y = this.y
        draw_circle(x, y, 1);

        this.render_trajectory();
    }
    render_trajectory() {
        const N_i = nr_of_precomputes;
        let state = [this.x, this.y, this.u, this.v];
        let states = [state];
        for (let i = 0; i < N_i; i++) {
            state = states[states.length - 1];
            let x_i = state[0];
            let y_i = state[1];

            state = euler(state, bodies); // woher?
            states.push(state);
            let x_f = state[0];
            let y_f = state[1];

            draw_line(x_i, y_i, x_f, y_f);
        }
    }
}

function euler(p, planets) {
    let x = p[0];
    let y = p[1];
    let u = p[2];
    let v = p[3];
    let a = [0, 0];
    for (let i = 0; i < planets.length; i++) {
        let da = get_acc_from_other(p, planets[i])
        a = [a[0] + da[0], a[1] + da[1]];
    }
    u = u + a[0] * dt;
    v = v + a[1] * dt
    x = x + u * dt
    y = y + v * dt;
    return [x, y, u, v];
}

function get_acc_from_other(p, o) {
    let dx = p[0] - o.x
    let dy = p[1] - o.y
    let r2 = Math.pow(dx, 2) + Math.pow(dy, 2);
    if (r2 == 0) {return [0, 0];}
    let a = -G * o.m / r2;
    r2 = r2 + Math.pow(eps, 2);
    let r = Math.pow(r2, 0.5);
    return [a * dx / r, a * dy / r]
}



var sun = new Planet(1, 0, 0, 0, 0);
var earth = new Planet(0.01, -1, 0, 0, -1);
var planets = [earth];
var bodies = planets.concat([sun]);

var rocket = new Rocket(0.5, 0, 0, 1);

var universe = new Universe(sun, planets, rocket)

window.setInterval(() => {
    ctx.clearRect(0, 0, W, H)
    if (!paused) {
        for (i = 0; i < 20; i++) {
            universe.forward();
        }
    }
    universe.render();
}, 1000 / 60)

document.addEventListener("keydown", (event) => {
    var key = event.key;
    console.log(key);
    let boost = 0.01;

    if (key == " ") {
        paused = !paused;
    } else if (key == "h") {
        rocket.u -= boost;
    } else if (key == "j") {
        rocket.v -= boost;
    } else if (key == "k") {
        rocket.v += boost;
    } else if (key == "l") {
        rocket.u += boost;
    }
});

var slider_1 = document.getElementById("input_planet_mass");
slider_1.oninput = function () {
    universe.planets[0].m = slider_1.value / 1000;
}
slider_1.min = 1;
slider_1.max = 5000;
slider_1.step = 1;
slider_1.value = universe.planets[0].m * 1000;

function speed(u, v) {
    s2 = Math.pow(u, 2) + Math.pow(v, 2);
    s = Math.pow(s2, 0.5);
    return s;
}

var slider_2 = document.getElementById("input_rocket_speed");
r = universe.rocket;
slider_2.oninput = function () {
    s = speed(r.u, r.v)
    S = slider_2.value / 10;
    if (S == 0) {return;}
    r.u = S / s * r.u
    r.v = S / s * r.v
    let p = document.getElementById("p_rocket_speed");
    p.innerHTML = "rocket speed = " + S;
}
slider_2.min = -100;
slider_2.max = 100;
slider_2.step = 1;
slider_2.value = speed(r.u, r.v) * 10;

var slider_3 = document.getElementById("input_precomputes");
slider_3.oninput = function () {
    console.log(slider_3.value);
    nr_of_precomputes = Number(slider_3.value);
    console.log(nr_of_precomputes);
}
slider_3.min = 1;
slider_3.max = 100000;
slider_3.step = 1;
slider_3.value = nr_of_precomputes;

var slider_4 = document.getElementById("input_time_step");
slider_4.oninput = function () {
    dt = slider_4.value / 10000;
}
slider_4.min = 1;
slider_4.max = 100;
slider_4.step = 1;
slider_4.value = dt * 10000;

var slider_5 = document.getElementById("input_gravity");
slider_5.oninput = function () {
    G = slider_5.value / 10;
    let p = document.getElementById("p_gravity");
    p.innerHTML = "gravity: G = " + G;
}
slider_5.min = -100
slider_5.max = 100
slider_5.value = G * 10
slider_5.step = 1
