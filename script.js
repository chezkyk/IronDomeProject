let result;
let missilesQueue = [];

document.addEventListener('DOMContentLoaded', () => {
    const failureSound = document.getElementById('failureSound');
    const missilesInTheAirSound = document.getElementById('MissilesInTheAir');
    const successSound = document.getElementById('SuccessSound');
    
    failureSound.load();
    missilesInTheAirSound.load();
    successSound.load();
});

const loadMissilesJson = async() => {
    const response = await fetch('missileData.json');
    result = await response.json();
    console.log(`result = ${JSON.stringify(result)}`);
    
    prepareMissilesQueue();
    updateMissilesLine();
    publishMissilesAccordingToTime();
}

const socket = new WebSocket('ws://localhost:3108/MissileHandler');

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    const message = `Name: ${data.missileName}, Interceptor: ${data.intercepted ? 'Yes' : 'No'}`;
    
    if (data.intercepted === true) {
        const successMissileDisplay = document.getElementById('successMissileDisplay');
        successMissileDisplay.innerText += message + '\n';
        const successSound = document.getElementById('SuccessSound');
        successSound.play().catch(e => console.error('Error playing success sound:', e));
    } else {
        const failureMissileDisplay = document.getElementById('failureMissileDisplay');
        failureMissileDisplay.innerText += message + '\n';
        const failureSound = document.getElementById('failureSound');
        failureSound.play().catch(e => console.error('Error playing failure sound:', e));
    }
};

const prepareMissilesQueue = () => {
    missilesQueue = result.map(missile => ({
        ...missile,
        launchTime: Date.now() + missile.Time
    }));
    missilesQueue.sort((a, b) => a.launchTime - b.launchTime);
}

const updateMissilesLine = () => {
    const missilesLine = document.getElementById('missilesLine');
    missilesLine.innerHTML = '';
    
    const currentTime = Date.now();
    missilesQueue = missilesQueue.filter(missile => {
        const timeUntilLaunch = Math.max(0, Math.floor((missile.launchTime - currentTime) / 1000));
        if (timeUntilLaunch > 0) {
            missilesLine.innerHTML += `${missile.Name} - ${timeUntilLaunch} seconds<br>`;
            return true;
        } else {
            moveMissileToAirborne(missile);
            return false;
        }
    });
    
    if (missilesQueue.length > 0) {
        setTimeout(updateMissilesLine, 1000);
    }
}

const moveMissileToAirborne = (missile) => {
    const airborneSection = document.getElementById('missilesOnTheAir');
    airborneSection.innerHTML += `${missile.Name} is on the air<br>`;
    
    const missilesInTheAirSound = document.getElementById('MissilesInTheAir');
    missilesInTheAirSound.play().catch(e => console.error('Error playing missiles in the air sound:', e));
    
    setTimeout(() => {
        const lines = airborneSection.innerHTML.split('<br>');
        lines.shift(); // Remove the first line (oldest missile)
        airborneSection.innerHTML = lines.join('<br>');
    }, 3000);
}

const publishMissilesAccordingToTime = () => {
    const startTime = Date.now();
    
    result.forEach(missile => {
        const delay = missile.Time - (Date.now() - startTime);
        
        setTimeout(() => {
            socket.send(JSON.stringify(missile));
        }, Math.max(0, delay));
    });
};

loadMissilesJson();
