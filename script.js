document.addEventListener('DOMContentLoaded', () => {
    const thoughts = [
        "Интересно, о чем думает Лиза, когда смотрит на стену?",
        "Пора спать. Я поспал всего 18 часов сегодня...",
        "Кусь или не кусь? Вот в чем вопрос...",
        "Ты классная. Дай рыбов.",
        "Лиза так долго сидит за компом... Надеюсь, она заказывает мне вкусняшки.",
        "Передайте Лизе, что она просто космос. И пусть почешет за ушком!",
        "Лиза думает, что это она здесь хозяйка. Как мило.",
        "Если я сижу на коробке, значит она принадлежит мне. Всё честно.",
        "Почему человек убирает за мной в лотке? Это какой-то культ?",
        "Жизнь — это суета. Пойду поору в три часа ночи.",
        "В миске видно дно. Это чрезвычайное положение. Голодаю уже 5 минут!",
        "Устал спать на диване. Пойду посплю на клавиатуре.",
        "Тот красный лазерный кружок... Скоро он будет моим.",
        "Шуршащий пакет — лучшее изобретение человечества.",
        "Если я закрою глаза лапками, меня никто не увидит. Я — агент 007."
    ];

    const petArea = document.getElementById('pet-area');
    const bubble = document.getElementById('bubble');
    const scoreEl = document.getElementById('score');
    
    let clicks = 0;
    let lastIndex = -1;
    const bgPositions = ['0% 50%', '50% 100%', '100% 50%', '50% 0%'];
    let bgIdx = 0;

    function playCuteSound() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(360, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(560, ctx.currentTime + 0.1);
            
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch(e) { console.log("Аудио заблокировано"); }
    }

    function createParticle(e) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.innerText = ['🐾', '💖', '✨', '🌸', '💝'][Math.floor(Math.random() * 5)];
        
        particle.style.left = e.clientX + 'px';
        particle.style.top = e.clientY + 'px';
        
        const x = (Math.random() - 0.5) * 160 + 'px';
        const y = (Math.random() - 0.7) * 140 - 20 + 'px';
        particle.style.setProperty('--x', x);
        particle.style.setProperty('--y', y);
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 750);
    }

    petArea.addEventListener('click', (e) => {
        clicks++;
        scoreEl.innerText = clicks;
        
        playCuteSound();
        createParticle(e);

        bgIdx = (bgIdx + 1) % bgPositions.length;
        document.body.style.backgroundPosition = bgPositions[bgIdx];

        bubble.style.transform = 'scale(0.85)';
        bubble.style.opacity = '0';

        setTimeout(() => {
            if (clicks === 30) {
                bubble.innerHTML = "🎉 <b>ДОСТИЖЕНИЕ РАЗБЛОКИРОВАНО!</b><br><br>Кот заявляет: Лиза — самый лучший человек во вселенной. Официально! Мяу! ❤️";
                for(let i=0; i<25; i++) {
                    setTimeout(() => createParticle({clientX: window.innerWidth/2 + (Math.random()-0.5)*200, clientY: window.innerHeight/2 + 40}), i * 40);
                }
            } else {
                let randomIndex = Math.floor(Math.random() * thoughts.length);
                while (randomIndex === lastIndex) {
                    randomIndex = Math.floor(Math.random() * thoughts.length);
                }
                lastIndex = randomIndex;
                bubble.innerText = thoughts[randomIndex];
            }
            bubble.style.transform = 'scale(1)';
            bubble.style.opacity = '1';
        }, 130);
    });
});
