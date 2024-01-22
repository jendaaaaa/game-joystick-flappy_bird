////// INITIALIZATION
// CONSTANTS
let INTERVAL_INIT_OBSTACLE = 600;
let INTERVAL_INIT_BIRD = 200;
let INTERVAL_LIMIT = 200;
let INTERVAL_STEP_OBSTACLE = 100;
let INTERVAL_STEP_BIRD = 25;
let BRIGHTNESS_OBSTACLE = 100;
let PIN_Y = AnalogPin.P1;
let PIN_UP = DigitalPin.P14;
let PIN_DOWN = DigitalPin.P16;
let TIME_DEBOUNCE = 20;
let INP_PRESSED = true;
let INP_RELEASED = false;
let VALUE_DEADZONE = 400;
let VALUE_CENTER = 511;
let DELAY_INPUT = 50;

// VARIABLES
let obstacle_empty = 0;
let ticks = 0;
let interval_obstacle = INTERVAL_INIT_OBSTACLE;
let interval_bird = 200;
let gap = 3;
let state = 0;
let add_point = false;
let continue_moving = false;

// DEBOUNCING
let button_state = false;
let last_button_state = false;
let last_debounce_time = 0;
let button_state2 = 1;
let last_button_state2 = 1;
let last_debounce_time2 = 0;

// OBJECTS
let Bird: game.LedSprite = null;
let Obstacles: game.LedSprite[] = [];

// STATES
let STATE_INIT = 0;
let STATE_MOVE = 1;
let STATE_WAIT = 2;
let STATE_OVER = 3;

// INIT
state = STATE_INIT;
pins.setPull(PIN_UP, PinPullMode.PullUp);

////// INPUTS
// BUTTONS
input.onButtonPressed(Button.A, function () {
    Bird.change(LedSpriteProperty.Y, -1);
})

input.onButtonPressed(Button.B, function () {
    Bird.change(LedSpriteProperty.Y, 1);
})

////// MAIN
basic.forever(function () {
    debounceJoystick();
    debounceButton();
    switch (state){
        case STATE_INIT:
            Bird = game.createSprite(0, 2);
            game.setScore(0);
            interval_bird = INTERVAL_INIT_BIRD;
            interval_obstacle = INTERVAL_INIT_OBSTACLE;
            state = STATE_MOVE;
            break;
        case STATE_MOVE:
            while (Obstacles.length > 0 && Obstacles[0].get(LedSpriteProperty.X) == 0) {
                Obstacles.removeAt(0).delete();
            }
            for (let obstacle of Obstacles) {
                obstacle.change(LedSpriteProperty.X, -1);
            }
            if (ticks % gap === 0) {
                obstacle_empty = randint(0, 4);
                for (let index = 0; index <= 4; index++) {
                    if (index != obstacle_empty) {
                        let obstacle_new = game.createSprite(4, index);
                        obstacle_new.set(LedSpriteProperty.Brightness, BRIGHTNESS_OBSTACLE);
                        Obstacles.push(obstacle_new);
                    }
                }
            }
            add_point = false;
            for (let obstacle of Obstacles){
                if (obstacle.get(LedSpriteProperty.X) == 0){
                    add_point = true;
                }
            }
            if (add_point){
                game.setScore(game.score()+1);
                if (game.score() - 1 % 5 == 0 && interval_obstacle > INTERVAL_LIMIT && game.score() < 10){
                    interval_obstacle = interval_obstacle - INTERVAL_STEP_OBSTACLE;
                    interval_bird = interval_bird - INTERVAL_STEP_BIRD;
                }
            }
            ticks += 1;
            state = STATE_WAIT;
            break;
        case STATE_WAIT:
            for (let obstacle of Obstacles) {
                if (obstacle.isTouching(Bird)) {
                    state = STATE_OVER;
                    break;
                }
            }
            break;
        case STATE_OVER:
            game.addScore(-1);
            pause(100);
            game.showScore();
            ticks = 0;
            while (Obstacles.length > 0) {
                Obstacles.removeAt(0).delete();
            }
            Bird.delete();
            state = STATE_INIT;
            break;
    }
})

// TIMING
basic.forever(function(){
    if(state == STATE_WAIT){
        basic.pause(interval_obstacle);
        state = STATE_MOVE;
    }
})

////// FUNCTIONS
// DEBOUNCING
function debounceJoystick() {
    let currentTime = input.runningTime();
    let buttonRead = (Math.abs(pins.analogReadPin(PIN_Y) - VALUE_CENTER) - VALUE_DEADZONE) > 0;
    if (buttonRead !== last_button_state) {
        last_debounce_time = currentTime;
    }
    if (input.runningTime() - last_debounce_time > TIME_DEBOUNCE) {
        if (buttonRead !== button_state) {
            button_state = buttonRead;
            if (button_state === INP_PRESSED) {
                continue_moving = true;
            } else {
                continue_moving = false;
            }
        }
    }
    last_button_state = buttonRead;
}

function debounceButton() {
    let currentTime = input.runningTime();
    let buttonRead = pins.digitalReadPin(PIN_UP);
    if (buttonRead !== last_button_state2) {
        last_debounce_time2 = currentTime;
    }
    if (input.runningTime() - last_debounce_time2 > TIME_DEBOUNCE) {
        if (buttonRead !== button_state2) {
            button_state2 = buttonRead;
            if (button_state2 === 0) {
                goFaster(true);
            } else {
                goFaster(false);
            }
        }
    }
    last_button_state2 = buttonRead;
}

// DIFFICULTY
function goFaster(tf : boolean = false){
    if (tf){
        interval_obstacle = interval_obstacle / 3;
        interval_bird = interval_bird / 3;
    } else {
        interval_obstacle = interval_obstacle * 3;
        interval_bird = interval_bird * 3;
    }
}

// BIRD MOVEMENT
basic.forever(function() {
    if(continue_moving){
        if (pins.analogReadPin(PIN_Y) - VALUE_CENTER > 0) {
            Bird.change(LedSpriteProperty.Y, -1);
        } else {
            Bird.change(LedSpriteProperty.Y, 1);
        }
        pause(interval_bird);
    }
})