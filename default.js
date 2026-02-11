// ========================================
//   ADVANCED COOKIE CLICKER DELUXE
// ========================================

setSize(1100, 650);

// ---------------- GAME DATA ----------------
let cookies = 0;
let cookiesPerClick = 1;

let generators = [
    {name:"Grandma", owned:0, baseCost:15, cps:1},
    {name:"Farm", owned:0, baseCost:100, cps:5},
    {name:"Factory", owned:0, baseCost:500, cps:20},
    {name:"Bank", owned:0, baseCost:3000, cps:100},
    {name:"Temple", owned:0, baseCost:20000, cps:500}
];

let clickUpgradeCost = 50;

let achievements = [];
let goldenCookieActive = false;
let goldenCookieTimer = 0;
let prestigePoints = 0;
let prestigeMultiplier = 1;

let particles = [];

// Combo stacking
let lastClickTime = 0;
let comboCount = 0;
let comboTimeout = null;

// Cookie pulse effect
let cookiePulse = {time:0,duration:180,maxScale:1};

let lastSavedTime = Date.now();

// ---------------- LAYOUT ----------------
let shopWidth, topBarHeight;
let cookieRadius, cookieBaseRadius;
let cookieX, cookieY;

let floatingTexts = [];
let hoverY = -1;

// ---------------- SAVE SYSTEM ----------------
function saveGame(){
    let data = {
        cookies:cookies,
        cookiesPerClick:cookiesPerClick,
        generators:generators,
        clickUpgradeCost:clickUpgradeCost,
        prestigePoints:prestigePoints,
        prestigeMultiplier:prestigeMultiplier,
        lastSaved:Date.now()
    };
    localStorage.setItem("cookieSaveNEW", JSON.stringify(data));
}

function loadGame(){
    let data = localStorage.getItem("cookieSaveNEW");
    if(data){
        let save = JSON.parse(data);
        cookies = save.cookies;
        cookiesPerClick = save.cookiesPerClick;
        generators = save.generators;
        clickUpgradeCost = save.clickUpgradeCost;
        prestigePoints = save.prestigePoints || 0;
        prestigeMultiplier = save.prestigeMultiplier || (1 + prestigePoints*0.1);
        
        // Offline progress
        let secondsAway = Math.floor((Date.now() - save.lastSaved)/1000);
        let earned = secondsAway * getCPS();
        cookies += earned;
        if(earned > 0){
            showAchievement("Offline Earnings +" + formatNumber(earned));
        }
    }
}

// ---------------- MAIN ----------------
function main(){
    loadGame();
    calculateLayout();
    drawEverything();
    
    mouseClickMethod(handleClick);
    mouseMoveMethod(handleHover);
    
    setTimer(gameTick,1000);
    setTimer(updateFloatingTexts,30);
    setTimer(goldenCookieTick,1000);
    setTimer(updateParticles,30);
    setTimer(updateEffects,30);
    setTimer(saveGame,5000);
}

// ---------------- LAYOUT ----------------
function calculateLayout(){
    shopWidth = getWidth()*0.30;
    topBarHeight = getHeight()*0.12;
    
    cookieRadius = Math.min(getWidth(),getHeight())*0.17;
    cookieBaseRadius = cookieRadius;
    
    cookieX = shopWidth + (getWidth()-shopWidth)/2;
    cookieY = getHeight()/2 + 20;
}

// ---------------- DRAW ----------------
function drawEverything(){
    removeAll();
    drawBackground();
    drawTopBar();
    drawShop();
    drawCookie();
    drawGoldenCookie();
}

function drawBackground(){
    let bg = new Rectangle(getWidth(),getHeight());
    bg.setPosition(0,0);
    bg.setColor(new Color(255,228,181));
    add(bg);
}

function drawTopBar(){
    let bar = new Rectangle(getWidth(),topBarHeight);
    bar.setPosition(0,0);
    bar.setColor(new Color(110,55,20));
    add(bar);
    
    let title = new Text(formatNumber(cookies)+" cookies","32pt Arial");
    title.setColor(Color.WHITE);
    title.setPosition(getWidth()/2 - title.getWidth()/2,40);
    add(title);
    
    let cpsText = new Text(formatNumber(getCPS())+" per second","18pt Arial");
    cpsText.setColor(Color.YELLOW);
    cpsText.setPosition(getWidth()/2 - cpsText.getWidth()/2,75);
    add(cpsText);

    let prestigeText = new Text("Prestige: "+prestigePoints+" (x"+prestigeMultiplier.toFixed(2)+")","14pt Arial");
    prestigeText.setColor(Color.LIGHT_GRAY);
    prestigeText.setPosition(getWidth()-prestigeText.getWidth()-20,20);
    add(prestigeText);
}

// ---------------- SHOP ----------------
function drawShop(){
    let panel = new Rectangle(shopWidth,getHeight());
    panel.setPosition(0,0);
    panel.setColor(new Color(200,170,130));
    add(panel);
    
    let y = topBarHeight + 20;
    let btnHeight = getHeight()*0.07;
    // Rebirth / prestige button
    let rebirthCost = getRebirthCost();
    drawButton("Rebirth (+1 Prestige) - "+formatNumber(rebirthCost), y, btnHeight, rebirthCost);
    y += btnHeight + 10;

    drawButton("Upgrade Click ("+formatNumber(clickUpgradeCost)+")",
               y, btnHeight, clickUpgradeCost);
    y += btnHeight + 10;
    
    for(let i=0;i<generators.length;i++){
        let gen = generators[i];
        let cost = getGeneratorCost(gen);
        drawButton(gen.name+" ("+gen.owned+") - "+formatNumber(cost),
                   y, btnHeight, cost);
        y += btnHeight + 8;
    }
}

function drawButton(text,y,h,cost){
    let affordable = cookies >= cost;
    
    let rect = new Rectangle(shopWidth-20,h);
    rect.setPosition(10,y);
    
    if(!affordable){
        rect.setColor(new Color(120,120,120));
    } else if(hoverY === y){
        rect.setColor(new Color(0,200,0));
    } else {
        rect.setColor(new Color(0,160,0));
    }
    add(rect);
    
    let label = new Text(text,"16pt Arial");
    label.setColor(Color.WHITE);
    label.setPosition(20,y+h/2+6);
    add(label);
}

// ---------------- COOKIE ----------------
function drawCookie(){
    let c = new Circle(cookieRadius);
    c.setPosition(cookieX,cookieY);
    c.setColor(new Color(181,101,29));
    add(c);
    
    for(let i=0;i<20;i++){
        let angle = Randomizer.nextFloat(0,Math.PI*2);
        let dist = Randomizer.nextFloat(0,cookieRadius-10);
        let x = cookieX + Math.cos(angle)*dist;
        let y = cookieY + Math.sin(angle)*dist;
        
        let chip = new Circle(5);
        chip.setPosition(x,y);
        chip.setColor(Color.BLACK);
        add(chip);
    }
}

// ---------------- GOLDEN COOKIE ----------------
function goldenCookieTick(){
    goldenCookieTimer++;
    
    if(!goldenCookieActive && goldenCookieTimer >= 15){
        goldenCookieActive = true;
        goldenCookieTimer = 0;
    }
}

function drawGoldenCookie(){
    if(goldenCookieActive){
        let g = new Circle(30);
        g.setPosition(cookieX + 200, cookieY - 150);
        g.setColor(Color.YELLOW);
        add(g);
    }
}

// ---------------- INPUT ----------------
function handleClick(e){
    
    let dx = e.getX()-cookieX;
    let dy = e.getY()-cookieY;
    let distance = Math.sqrt(dx*dx+dy*dy);
    
    if(distance <= cookieRadius){
        // Combo handling
        let now = Date.now();
        if(now - lastClickTime <= 600){
            comboCount++;
        } else {
            comboCount = 1;
        }
        lastClickTime = now;
        if(comboTimeout) clearTimeout(comboTimeout);
        comboTimeout = setTimeout(function(){ comboCount = 0; },1200);

        let crit = (Randomizer.nextInt(1,20) === 1);
        let baseGained = cookiesPerClick * (crit?5:1);
        let comboMultiplier = 1 + (Math.max(0,comboCount-1) * 0.15);
        let gained = Math.floor(baseGained * comboMultiplier * prestigeMultiplier);
        cookies += gained;
        createFloatingText("+"+formatNumber(gained),e.getX(),e.getY());
        if(comboCount>1) createComboVisual(comboCount);
        // start pulse (animated)
        cookiePulse.time = cookiePulse.duration;
        cookiePulse.maxScale = 1 + Math.min(0.35, comboCount*0.03);
        redraw();
        checkAchievements();
        return;
    }
    
    // Golden cookie click
    if(goldenCookieActive){
        let gx = cookieX + 200;
        let gy = cookieY - 150;
        let dist = Math.sqrt(Math.pow(e.getX()-gx,2)+Math.pow(e.getY()-gy,2));
        if(dist < 30){
            cookies += getCPS()*30;
            showAchievement("Golden Cookie Bonus!");
            goldenCookieActive = false;
            redraw();
            return;
        }
    }
    
    handleShopClick(e);
}

function handleHover(e){
    let y = topBarHeight + 20;
    let btnHeight = getHeight()*0.07;

    hoverY = -1;
    if(e.getX() > shopWidth) return;

    // check rebirth
    if(e.getY()>=y && e.getY()<=y+btnHeight){ hoverY = y; return; }
    y += btnHeight + 10;
    // check upgrade click
    if(e.getY()>=y && e.getY()<=y+btnHeight){ hoverY = y; return; }
    y += btnHeight + 10;
    // check generators
    for(let i=0;i<generators.length;i++){
        if(e.getY()>=y && e.getY()<=y+btnHeight){ hoverY = y; return; }
        y+=btnHeight+8;
    }
}

// ---------------- GAME LOGIC ----------------
function handleShopClick(e){
    if(e.getX() > shopWidth) return;
    
    let y = topBarHeight + 20;
    let btnHeight = getHeight()*0.07;
    
    // Rebirth button
    let rebirthCost = getRebirthCost();
    if(e.getY()>=y && e.getY()<=y+btnHeight){
        if(cookies>=rebirthCost){
            rebirth();
        }
        redraw();
        return;
    }

    y += btnHeight + 10;

    // Upgrade click button
    if(e.getY()>=y && e.getY()<=y+btnHeight){
        if(cookies>=clickUpgradeCost){
            cookies-=clickUpgradeCost;
            cookiesPerClick++;
            clickUpgradeCost=Math.floor(clickUpgradeCost*1.6);
        }
        redraw();
        return;
    }

    y += btnHeight + 10;

    // Generators
    for(let i=0;i<generators.length;i++){
        let cost = getGeneratorCost(generators[i]);
        if(e.getY()>=y && e.getY()<=y+btnHeight){
            if(cookies>=cost){
                cookies-=cost;
                generators[i].owned++;
                playBuyEffect(i);
            }
            redraw();
            return;
        }
        y+=btnHeight+8;
    }
}

function getRebirthCost(){
    return Math.floor(1e6 * (prestigePoints + 1));
}

function rebirth(){
    let cost = getRebirthCost();
    if(cookies < cost) return;
    prestigePoints++;
    prestigeMultiplier = 1 + prestigePoints * 0.1;
    // reset progress
    cookies = 0;
    cookiesPerClick = 1;
    clickUpgradeCost = 50;
    for(let g of generators){ g.owned = 0; }
    showAchievement("Rebirth! Prestige +1");
    // celebratory particles
    for(let i=0;i<40;i++){
        spawnParticle(cookieX + Randomizer.nextFloat(-cookieRadius,cookieRadius), cookieY + Randomizer.nextFloat(-cookieRadius,cookieRadius), Randomizer.nextFloat(-3,3), Randomizer.nextFloat(-6,-1), Randomizer.nextInt(30,60), {r:255,g:215,b:0}, Randomizer.nextFloat(3,7));
    }
}

function playBuyEffect(index){
    // spawn a few particles near the shop button
    let y = topBarHeight + 20 + (getHeight()*0.07 + 8) * (index+2);
    let x = 10 + (shopWidth-20)/2;
    for(let i=0;i<12;i++){
        spawnParticle(x + Randomizer.nextFloat(-20,20), y + Randomizer.nextFloat(-10,10), Randomizer.nextFloat(-2,2), Randomizer.nextFloat(-3,-0.5), Randomizer.nextInt(20,40), {r:200,g:100,b:50}, Randomizer.nextFloat(2,5));
    }
}

function createComboVisual(count){
    let t = new Text("Combo x"+count,"20pt Arial");
    t.setColor(Color.RED);
    t.setPosition(cookieX - t.getWidth()/2, cookieY - cookieRadius - 30 - (count%5)*12);
    add(t);
    setTimeout(function(){ remove(t); },700);
}

function gameTick(){
    cookies += getCPS();
    redraw();
}

// ---------------- EFFECTS ----------------
function bounce(){
    cookieRadius = cookieBaseRadius*1.1;
    redraw();
    setTimeout(function(){
        cookieRadius = cookieBaseRadius;
        redraw();
    },100);
}
function createFloatingText(text,x,y){
    let t = new Text(text,"20pt Arial");
    t.setColor(Color.PURPLE);
    t.setPosition(x,y);
    add(t);
    floatingTexts.push(t);
}

function spawnParticle(x,y,dx,dy,life,color,size){
    particles.push({x:x,y:y,dx:dx,dy:dy,life:life,maxLife:life,color:color,size:size});
}

function updateParticles(){
    for(let i=0;i<particles.length;i++){
        let p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.dy += 0.1;
        p.life -= 1;
        let alpha = p.life / p.maxLife;
        let circle = new Circle(p.size);
        circle.setPosition(p.x,p.y);
        // Color API doesn't accept alpha; fade by scaling RGB
        let fr = Math.max(0,Math.floor(p.color.r * alpha));
        let fg = Math.max(0,Math.floor(p.color.g * alpha));
        let fb = Math.max(0,Math.floor(p.color.b * alpha));
        circle.setColor(new Color(fr,fg,fb));
        add(circle);
        if(p.life<=0){
            particles.splice(i,1);
            i--;
        }
    }
}

function updateEffects(){
    // animate cookie pulse
    if(cookiePulse.time > 0){
        cookiePulse.time -= 30;
        if(cookiePulse.time < 0) cookiePulse.time = 0;
        let t = 1 - (cookiePulse.time / cookiePulse.duration); // 0->1
        // easeOutQuad
        let ease = 1 - (1 - t) * (1 - t);
        let scale = 1 + (cookiePulse.maxScale - 1) * ease;
        cookieRadius = cookieBaseRadius * scale;
        redraw();
    } else if(cookieRadius !== cookieBaseRadius){
        cookieRadius = cookieBaseRadius;
        redraw();
    }
}

function updateFloatingTexts(){
    for(let i=0;i<floatingTexts.length;i++){
        let t=floatingTexts[i];
        t.move(0,-2);
        if(t.getY()<0){
            remove(t);
            floatingTexts.splice(i,1);
            i--;
        }
    }
}

// ---------------- ACHIEVEMENTS ----------------
function checkAchievements(){
    if(cookies>=1000 && !achievements.includes("1k")){
        showAchievement("1,000 Cookies!");
        achievements.push("1k");
    }
}

function showAchievement(text){
    let t = new Text("Achievement: "+text,"20pt Arial");
    t.setColor(Color.ORANGE);
    t.setPosition(getWidth()/2 - t.getWidth()/2,120);
    add(t);
    
    setTimeout(function(){ remove(t); },3000);
}

// ---------------- HELPERS ----------------
function getGeneratorCost(gen){
    return Math.floor(gen.baseCost*Math.pow(1.15,gen.owned));
}

function getCPS(){
    let total=0;
    for(let g of generators){
        total+=g.owned*g.cps;
    }
    return Math.floor(total * prestigeMultiplier);
}

function formatNumber(num){
    if(num>=1e12) return (num/1e12).toFixed(2)+"T";
    if(num>=1e9) return (num/1e9).toFixed(2)+"B";
    if(num>=1e6) return (num/1e6).toFixed(2)+"M";
    if(num>=1e3) return (num/1e3).toFixed(2)+"K";
    return Math.floor(num).toString();
}

function redraw(){
    calculateLayout();
    drawEverything();
}

// ---------------- START ----------------
main();
