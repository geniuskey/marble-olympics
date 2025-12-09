/**
 * Marble Olympics (구슬 올림픽)
 * ------------------------------------------------------------
 * Original Copyright Notice
 *
 * Copyright (c) 2025 geniuskey
 *
 * This web application is an original creation by the developer known as
 * "geniuskey". Any third-party registration of this work, including copyright
 * filings made without the author's consent, does not invalidate the author's
 * original rights under Korean Copyright Law and international copyright
 * principles.
 *
 * Notes:
 * - Copyright is automatically granted upon creation (“무조건 자동 발생”).
 * - Copyright registration by unrelated parties does NOT transfer ownership.
 * - MIT License permits reuse but does NOT abandon authorship or ownership.
 * - Unauthorized registration by third parties shall be considered invalid.
 *
 * Original Creator: geniuskey (geniuskey@gmail.com)
 * Service Web Page: https://geniuskey.github.io/marble-olympics/
 * ------------------------------------------------------------
 */

// ===== Vector2 =====
class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vector2(this.x * s, this.y * s); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const len = this.length();
        return len > 0 ? this.mul(1 / len) : new Vector2();
    }
    dot(v) { return this.x * v.x + this.y * v.y; }
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
}

// ===== Ball =====
class Ball {
    constructor(x, y, radius, color, name, initialVelY = 0) {
        this.pos = new Vector2(x, y);
        this.vel = new Vector2((Math.random() - 0.5) * 50, initialVelY);  // 초기 Y 속도 + 약간의 X 랜덤
        this.radius = radius;
        this.color = color;
        this.name = name;
        this.restitution = 0.75;
        this.airResistance = 0.9995;
        this.finished = false;
        this.finishTime = null;
        this.trail = [];
        this.maxTrail = 12;
        this.stuckTime = 0;  // 멈춰있는 시간 추적
        this.lastPos = new Vector2(x, y);
        this.posHistory = [];  // 핑퐁 감지용 위치 히스토리
        this.posHistoryTimer = 0;
    }

    update(gravity, dt) {
        if (this.finished) {
            this.trail = [];  // 도착하면 trail 제거
            return;
        }
        
        // Trail
        this.trail.push({ x: this.pos.x, y: this.pos.y });
        if (this.trail.length > this.maxTrail) this.trail.shift();
        
        // 가속도 기반 물리
        this.vel = this.vel.add(gravity.mul(dt));
        this.vel = this.vel.mul(this.airResistance);
        this.pos = this.pos.add(this.vel.mul(dt));
        
        // 위치 히스토리 업데이트 (핑퐁 감지용)
        this.posHistoryTimer += dt;
        if (this.posHistoryTimer >= 0.5) {  // 0.5초마다 위치 기록
            this.posHistoryTimer = 0;
            this.posHistory.push({ x: this.pos.x, y: this.pos.y });
            if (this.posHistory.length > 6) this.posHistory.shift();  // 최근 3초간 기록
        }
        
        // 멈춤 감지 (속도가 매우 낮을 때)
        const speed = this.vel.length();
        const moved = this.pos.sub(this.lastPos).length();
        if (speed < 5 && moved < 1) {
            this.stuckTime += dt;
        } else {
            this.stuckTime = 0;
        }
        this.lastPos = new Vector2(this.pos.x, this.pos.y);
    }
    
    // 핑퐁 상태 감지 (좁은 영역에서 왔다갔다)
    isPingPonging() {
        if (this.posHistory.length < 6) return false;
        
        // 최근 3초간의 위치들이 좁은 범위 내에 있는지 확인
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const p of this.posHistory) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }
        
        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        
        // X 범위가 좁고(100px 이내) Y방향 진행이 거의 없으면(50px 이내) 핑퐁
        return rangeX < 100 && rangeY < 50;
    }
    
    // 막혔을 때 랜덤 힘 적용
    unstuck() {
        const angle = Math.random() * Math.PI * 2;
        const force = 150 + Math.random() * 100;
        this.vel.x += Math.cos(angle) * force;
        this.vel.y += Math.sin(angle) * force - 50;  // 약간 위로
        this.stuckTime = 0;
        this.posHistory = [];  // 히스토리 초기화
    }
    
    // 핑퐁 탈출 - 더 강하게 아래로
    escapePingPong() {
        const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.5;  // 대략 아래 방향
        const force = 300 + Math.random() * 150;
        this.vel.x = Math.cos(angle) * force;
        this.vel.y = Math.sin(angle) * force + 200;  // 강하게 아래로
        this.posHistory = [];
    }
}

// ===== Obstacles =====
class Peg {
    constructor(x, y, radius = 8) {
        this.type = 'peg';
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = 'rgba(255, 255, 255, 0.5)';
    }
}

class Bumper {
    constructor(x, y, radius = 25) {
        this.type = 'bumper';
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.force = 600;  // 더 강한 반발력
        this.color = '#ff6b6b';
        this.hitTime = 0;
    }
}

class Spinner {
    constructor(x, y, length = 60, speed = 2) {
        this.type = 'spinner';
        this.x = x;
        this.y = y;
        this.length = length;
        this.speed = speed;
        this.angle = Math.random() * Math.PI * 2;
        this.color = '#ffd700';
    }

    update(dt) {
        this.angle += this.speed * dt;
    }

    getEndpoints() {
        const dx = Math.cos(this.angle) * this.length / 2;
        const dy = Math.sin(this.angle) * this.length / 2;
        return {
            x1: this.x - dx, y1: this.y - dy,
            x2: this.x + dx, y2: this.y + dy
        };
    }
}

class Portal {
    constructor(x1, y1, x2, y2, color = '#00d4ff') {
        this.type = 'portal';
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
        this.radius = 22;
        this.color = color;
        this.cooldown = new Map();
    }
}

// 포탈 색상 팔레트
const PORTAL_COLORS = [
    '#00d4ff',  // 시안
    '#ff6b9d',  // 핑크
    '#a855f7',  // 보라
    '#10ac84',  // 초록
    '#ffd93d',  // 노랑
];

class Booster {
    constructor(x, y, angle, force = 600) {
        this.type = 'booster';
        this.x = x;
        this.y = y;
        // 360도 랜덤 방향
        this.angle = Math.random() * Math.PI * 2;
        this.force = force;
        this.radius = 18;
        this.color = '#10ac84';
        this.hitTime = 0;
    }
}

class Wall {
    constructor(x1, y1, x2, y2, thickness = 6) {
        this.type = 'wall';
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
        this.thickness = thickness;
        this.color = 'rgba(255, 255, 255, 0.3)';
    }
}

class Triangle {
    constructor(x, y, size, angle = 0) {
        this.type = 'triangle';
        this.x = x;
        this.y = y;
        this.size = size;
        this.angle = angle;
        this.color = 'rgba(255, 159, 67, 0.6)';
    }

    getVertices() {
        const verts = [];
        for (let i = 0; i < 3; i++) {
            const a = this.angle + (i * Math.PI * 2 / 3) - Math.PI / 2;
            verts.push({
                x: this.x + Math.cos(a) * this.size,
                y: this.y + Math.sin(a) * this.size
            });
        }
        return verts;
    }
}

// ===== Physics World =====
class PhysicsWorld {
    constructor(width, viewHeight) {
        this.width = width;
        this.viewHeight = viewHeight;  // 보이는 화면 높이
        this.height = viewHeight * 3;  // 실제 맵 높이 (3배)
        // 중력 (10% 증가)
        this.gravity = new Vector2(0, 352);
        this.balls = [];
        this.obstacles = [];
        this.finishLine = this.height - 70;
        this.rankings = [];
        this.time = 0;
        this.cameraY = 0;  // 카메라 Y 위치
    }

    addBall(ball) { this.balls.push(ball); }
    addObstacle(obs) { this.obstacles.push(obs); }
    
    // 가장 앞서가는 공(아직 도착 안 한 공 중 가장 아래에 있는 공) 찾기
    getLeadingBall() {
        let leader = null;
        let maxY = -Infinity;
        for (const ball of this.balls) {
            if (!ball.finished && ball.pos.y > maxY) {
                maxY = ball.pos.y;
                leader = ball;
            }
        }
        return leader;
    }
    
    updateCamera() {
        const leader = this.getLeadingBall();
        if (leader) {
            // 리더가 화면의 상단 1/3 지점에 오도록 카메라 이동
            const targetY = leader.pos.y - this.viewHeight * 0.35;
            // 부드러운 카메라 이동
            this.cameraY += (targetY - this.cameraY) * 0.08;
            // 범위 제한
            this.cameraY = Math.max(0, Math.min(this.cameraY, this.height - this.viewHeight));
        }
    }

    update(dt) {
        this.time += dt;

        // Update spinners
        for (const obs of this.obstacles) {
            if (obs.type === 'spinner') obs.update(dt);
        }

        for (const ball of this.balls) {
            ball.update(this.gravity, dt);
            this.collideWalls(ball);

            for (const obs of this.obstacles) {
                this.collideObstacle(ball, obs);
            }

            // Finish line
            if (!ball.finished && ball.pos.y + ball.radius >= this.finishLine) {
                ball.finished = true;
                ball.finishTime = performance.now();
                ball.pos.y = this.finishLine - ball.radius;
                ball.vel = new Vector2(ball.vel.x * 0.2, 0);
                ball.trail = [];  // trail 즉시 제거
                this.rankings.push(ball);
            }
            
            // 막힘 감지 및 해제 (1.5초 이상 멈춰있으면)
            if (!ball.finished && ball.stuckTime > 1.5) {
                ball.unstuck();
            }
            
            // 핑퐁 감지 및 탈출 (좁은 범위에서 왔다갔다 할 때)
            if (!ball.finished && ball.isPingPonging()) {
                ball.escapePingPong();
            }
        }

        // Ball-ball collision
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                this.collideBalls(this.balls[i], this.balls[j]);
            }
        }
        
        // hit된 핀 제거
        this.obstacles = this.obstacles.filter(obs => !(obs.type === 'peg' && obs.hit));
        
        // 카메라 업데이트
        this.updateCamera();
    }

    collideWalls(ball) {
        const margin = 5;
        // 벽 충돌 시 에너지 보존율 높임
        const wallRestitution = 0.85;
        
        if (ball.pos.x - ball.radius < margin) {
            ball.pos.x = ball.radius + margin;
            ball.vel.x *= -wallRestitution;
        }
        if (ball.pos.x + ball.radius > this.width - margin) {
            ball.pos.x = this.width - ball.radius - margin;
            ball.vel.x *= -wallRestitution;
        }
        if (ball.pos.y - ball.radius < margin) {
            ball.pos.y = ball.radius + margin;
            ball.vel.y *= -wallRestitution;
        }
    }

    collideObstacle(ball, obs) {
        if (obs.type === 'peg') {
            if (this.collideCircle(ball, obs.x, obs.y, obs.radius, ball.restitution)) {
                // 핀에 부딪히면 핀 제거 표시
                obs.hit = true;
            }
        } else if (obs.type === 'bumper') {
            if (this.collideCircle(ball, obs.x, obs.y, obs.radius, 1.0)) {
                // 범퍼에서 강하게 튕겨나감
                const dx = ball.pos.x - obs.x;
                const dy = ball.pos.y - obs.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const impulse = obs.force;
                    ball.vel.x += (dx / dist) * impulse * 0.05;
                    ball.vel.y += (dy / dist) * impulse * 0.05;
                }
                obs.hitTime = this.time;
            }
        } else if (obs.type === 'spinner') {
            const ep = obs.getEndpoints();
            this.collideLine(ball, ep.x1, ep.y1, ep.x2, ep.y2, 5);
        } else if (obs.type === 'wall') {
            this.collideLine(ball, obs.x1, obs.y1, obs.x2, obs.y2, obs.thickness);
        } else if (obs.type === 'portal') {
            const dist1 = Math.sqrt((ball.pos.x - obs.x1) ** 2 + (ball.pos.y - obs.y1) ** 2);
            const dist2 = Math.sqrt((ball.pos.x - obs.x2) ** 2 + (ball.pos.y - obs.y2) ** 2);
            
            const lastTeleport = obs.cooldown.get(ball) || 0;
            if (this.time - lastTeleport > 0.5) {
                if (dist1 < obs.radius + ball.radius) {
                    ball.pos.x = obs.x2;
                    ball.pos.y = obs.y2 + obs.radius + ball.radius + 5;
                    obs.cooldown.set(ball, this.time);
                } else if (dist2 < obs.radius + ball.radius) {
                    ball.pos.x = obs.x1;
                    ball.pos.y = obs.y1 + obs.radius + ball.radius + 5;
                    obs.cooldown.set(ball, this.time);
                }
            }
        } else if (obs.type === 'booster') {
            const dist = Math.sqrt((ball.pos.x - obs.x) ** 2 + (ball.pos.y - obs.y) ** 2);
            if (dist < obs.radius + ball.radius) {
                // 부스터 방향으로 강하게 가속
                ball.vel.x += Math.cos(obs.angle) * obs.force * 0.06;
                ball.vel.y += Math.sin(obs.angle) * obs.force * 0.06;
                obs.hitTime = this.time;
            }
        } else if (obs.type === 'triangle') {
            const verts = obs.getVertices();
            for (let i = 0; i < 3; i++) {
                const v1 = verts[i];
                const v2 = verts[(i + 1) % 3];
                this.collideLine(ball, v1.x, v1.y, v2.x, v2.y, 3);
            }
        }
    }

    collideCircle(ball, cx, cy, cr, restitution) {
        const dx = ball.pos.x - cx;
        const dy = ball.pos.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = ball.radius + cr;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            ball.pos.x += nx * overlap;
            ball.pos.y += ny * overlap;

            const dotProduct = ball.vel.x * nx + ball.vel.y * ny;
            // 반발 계수 적용 (에너지 보존율 높음)
            const bounce = 1 + restitution * ball.restitution;
            ball.vel.x -= bounce * dotProduct * nx;
            ball.vel.y -= bounce * dotProduct * ny;
            return true;
        }
        return false;
    }

    collideLine(ball, x1, y1, x2, y2, thickness) {
        const lineVec = new Vector2(x2 - x1, y2 - y1);
        const lineLen = lineVec.length();
        if (lineLen === 0) return;
        
        const lineDir = lineVec.normalize();
        const toBall = new Vector2(ball.pos.x - x1, ball.pos.y - y1);
        
        let t = toBall.dot(lineDir);
        t = Math.max(0, Math.min(lineLen, t));
        
        const closest = new Vector2(x1 + lineDir.x * t, y1 + lineDir.y * t);
        const dist = ball.pos.sub(closest).length();
        const minDist = ball.radius + thickness / 2;
        
        if (dist < minDist && dist > 0) {
            const normal = ball.pos.sub(closest).normalize();
            const overlap = minDist - dist;
            
            ball.pos = ball.pos.add(normal.mul(overlap));
            
            const dotProduct = ball.vel.x * normal.x + ball.vel.y * normal.y;
            // 에너지 보존율 높임
            const bounce = 1 + ball.restitution * 0.9;
            ball.vel.x -= bounce * dotProduct * normal.x;
            ball.vel.y -= bounce * dotProduct * normal.y;
        }
    }

    collideBalls(a, b) {
        const dx = b.pos.x - a.pos.x;
        const dy = b.pos.y - a.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = a.radius + b.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            a.pos.x -= nx * overlap * 0.5;
            a.pos.y -= ny * overlap * 0.5;
            b.pos.x += nx * overlap * 0.5;
            b.pos.y += ny * overlap * 0.5;

            const relVelX = a.vel.x - b.vel.x;
            const relVelY = a.vel.y - b.vel.y;
            const relVelDot = relVelX * nx + relVelY * ny;

            if (relVelDot > 0) {
                // 탄성 충돌에 가깝게 (에너지 거의 보존)
                const restitution = 0.95;
                const impulse = relVelDot * (1 + restitution) / 2;

                a.vel.x -= impulse * nx;
                a.vel.y -= impulse * ny;
                b.vel.x += impulse * nx;
                b.vel.y += impulse * ny;
            }
        }
    }

    isFinished() {
        return this.balls.length > 0 && this.balls.every(b => b.finished);
    }
}

// ===== Map Generators =====
// 맵은 viewHeight의 3배 높이로 생성됨
const MapGenerators = {
    chaos(world, w, h) {
        // h는 이제 실제 맵 높이 (viewHeight * 3)
        
        // ===== 포탈 5쌍 (색상별) =====
        world.addObstacle(new Portal(w * 0.08, h * 0.08, w * 0.92, h * 0.22, PORTAL_COLORS[0]));  // 시안
        world.addObstacle(new Portal(w * 0.15, h * 0.35, w * 0.85, h * 0.52, PORTAL_COLORS[1]));  // 핑크
        world.addObstacle(new Portal(w * 0.1, h * 0.58, w * 0.5, h * 0.72, PORTAL_COLORS[2]));   // 보라
        world.addObstacle(new Portal(w * 0.9, h * 0.75, w * 0.2, h * 0.88, PORTAL_COLORS[3]));   // 초록
        world.addObstacle(new Portal(w * 0.5, h * 0.45, w * 0.5, h * 0.82, PORTAL_COLORS[4]));   // 노랑
        
        // ===== 섹션 1 (0% ~ 15%) - 시작 구간 =====
        // 밀집 핀 필드
        for (let row = 0; row < 10; row++) {
            const cols = row % 2 === 0 ? 9 : 8;
            const baseOffsetX = row % 2 === 0 ? w / 18 : w / 18 + w / 18;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 9);
                const y = 60 + row * 42;
                world.addObstacle(new Peg(x, y, 6));
            }
        }
        world.addObstacle(new Spinner(w * 0.2, h * 0.06, 55, 3.5));
        world.addObstacle(new Spinner(w * 0.5, h * 0.04, 65, -3));
        world.addObstacle(new Spinner(w * 0.8, h * 0.06, 55, 3.5));
        world.addObstacle(new Bumper(w * 0.35, h * 0.1, 22));
        world.addObstacle(new Bumper(w * 0.65, h * 0.1, 22));

        // ===== 섹션 2 (15% ~ 30%) - 범퍼 지옥 =====
        world.addObstacle(new Bumper(w * 0.15, h * 0.17, 24));
        world.addObstacle(new Bumper(w * 0.35, h * 0.15, 22));
        world.addObstacle(new Bumper(w * 0.5, h * 0.18, 26));
        world.addObstacle(new Bumper(w * 0.65, h * 0.15, 22));
        world.addObstacle(new Bumper(w * 0.85, h * 0.17, 24));
        world.addObstacle(new Spinner(w * 0.25, h * 0.22, 70, -2.5));
        world.addObstacle(new Spinner(w * 0.75, h * 0.22, 70, 2.5));
        world.addObstacle(new Bumper(w * 0.5, h * 0.25, 28));
        // 부스터 추가
        world.addObstacle(new Booster(w * 0.12, h * 0.24, -Math.PI / 4, 600));
        world.addObstacle(new Booster(w * 0.88, h * 0.24, -Math.PI * 3 / 4, 600));
        // 삼각형 장애물
        world.addObstacle(new Triangle(w * 0.2, h * 0.28, 24, Math.PI / 6));
        world.addObstacle(new Triangle(w * 0.8, h * 0.28, 24, -Math.PI / 6));

        // ===== 섹션 3 (30% ~ 45%) - 스피너 숲 =====
        world.addObstacle(new Spinner(w * 0.15, h * 0.32, 50, 3));
        world.addObstacle(new Spinner(w * 0.35, h * 0.35, 60, -2.5));
        world.addObstacle(new Spinner(w * 0.55, h * 0.33, 55, 3));
        world.addObstacle(new Spinner(w * 0.75, h * 0.36, 60, -2.5));
        world.addObstacle(new Spinner(w * 0.9, h * 0.34, 45, 3));
        // 핀 산개 배치
        for (let row = 0; row < 6; row++) {
            const cols = row % 2 === 0 ? 7 : 6;
            const baseOffsetX = row % 2 === 0 ? w / 14 : w / 14 + w / 14;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 7);
                const y = h * 0.38 + row * 38;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        world.addObstacle(new Booster(w * 0.1, h * 0.42, -Math.PI / 5, 650));
        world.addObstacle(new Booster(w * 0.9, h * 0.42, -Math.PI * 4 / 5, 650));

        // ===== 섹션 4 (45% ~ 60%) - 부스터 존 =====
        world.addObstacle(new Bumper(w * 0.25, h * 0.48, 26));
        world.addObstacle(new Bumper(w * 0.5, h * 0.46, 30));
        world.addObstacle(new Bumper(w * 0.75, h * 0.48, 26));
        world.addObstacle(new Booster(w * 0.15, h * 0.52, -Math.PI / 3, 700));
        world.addObstacle(new Booster(w * 0.5, h * 0.54, -Math.PI / 2, 800));
        world.addObstacle(new Booster(w * 0.85, h * 0.52, -Math.PI * 2 / 3, 700));
        world.addObstacle(new Spinner(w * 0.35, h * 0.56, 65, 2.5));
        world.addObstacle(new Spinner(w * 0.65, h * 0.56, 65, -2.5));
        // 벽 장애물
        world.addObstacle(new Wall(w * 0.2, h * 0.58, w * 0.35, h * 0.62, 6));
        world.addObstacle(new Wall(w * 0.8, h * 0.58, w * 0.65, h * 0.62, 6));

        // ===== 섹션 5 (60% ~ 75%) - 밀집 핀 + 범퍼 =====
        for (let row = 0; row < 8; row++) {
            const cols = row % 2 === 0 ? 10 : 9;
            const baseOffsetX = row % 2 === 0 ? w / 20 : w / 20 + w / 20;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 10);
                const y = h * 0.63 + row * 35;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        world.addObstacle(new Bumper(w * 0.2, h * 0.67, 24));
        world.addObstacle(new Bumper(w * 0.4, h * 0.7, 22));
        world.addObstacle(new Bumper(w * 0.6, h * 0.7, 22));
        world.addObstacle(new Bumper(w * 0.8, h * 0.67, 24));
        world.addObstacle(new Spinner(w * 0.5, h * 0.73, 80, 3));
        // 섹션 5 하단에 부스터 추가
        world.addObstacle(new Booster(w * 0.1, h * 0.74, -Math.PI / 4, 600));
        world.addObstacle(new Booster(w * 0.9, h * 0.74, -Math.PI * 3 / 4, 600));

        // ===== 섹션 6 (75% ~ 95%) - 최종 구간 강화 =====
        // 벽 깔때기
        world.addObstacle(new Wall(5, h * 0.76, w * 0.2, h * 0.82, 6));
        world.addObstacle(new Wall(w - 5, h * 0.76, w * 0.8, h * 0.82, 6));
        world.addObstacle(new Triangle(w * 0.25, h * 0.78, 24, Math.PI / 4));
        world.addObstacle(new Triangle(w * 0.75, h * 0.78, 24, -Math.PI / 4));
        world.addObstacle(new Bumper(w * 0.15, h * 0.80, 22));
        world.addObstacle(new Bumper(w * 0.5, h * 0.78, 26));
        world.addObstacle(new Bumper(w * 0.85, h * 0.80, 22));
        
        // 핀 밀집 구간
        for (let row = 0; row < 5; row++) {
            const cols = row % 2 === 0 ? 7 : 6;
            const baseOffsetX = row % 2 === 0 ? w / 14 : w / 14 + w / 14;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 7);
                const y = h * 0.82 + row * 28;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        
        world.addObstacle(new Spinner(w * 0.3, h * 0.85, 50, -3));
        world.addObstacle(new Spinner(w * 0.7, h * 0.85, 50, 3));
        world.addObstacle(new Bumper(w * 0.35, h * 0.88, 20));
        world.addObstacle(new Bumper(w * 0.65, h * 0.88, 20));
        
        // 골 직전 부스터 라인 (위로 쏘는 부스터들!)
        world.addObstacle(new Booster(w * 0.15, h * 0.92, -Math.PI / 2, 650));
        world.addObstacle(new Booster(w * 0.35, h * 0.94, -Math.PI / 2, 700));
        world.addObstacle(new Booster(w * 0.5, h * 0.93, -Math.PI / 2, 750));
        world.addObstacle(new Booster(w * 0.65, h * 0.94, -Math.PI / 2, 700));
        world.addObstacle(new Booster(w * 0.85, h * 0.92, -Math.PI / 2, 650));
        
        // 마지막 삼각형 장애물
        world.addObstacle(new Triangle(w * 0.25, h * 0.96, 18));
        world.addObstacle(new Triangle(w * 0.5, h * 0.97, 20));
        world.addObstacle(new Triangle(w * 0.75, h * 0.96, 18));
    },

    pinball(world, w, h) {
        // ===== 포탈 5쌍 (색상별) =====
        world.addObstacle(new Portal(w * 0.1, h * 0.05, w * 0.9, h * 0.18, PORTAL_COLORS[0]));   // 시안
        world.addObstacle(new Portal(w * 0.08, h * 0.3, w * 0.5, h * 0.45, PORTAL_COLORS[1]));   // 핑크
        world.addObstacle(new Portal(w * 0.92, h * 0.5, w * 0.15, h * 0.68, PORTAL_COLORS[2])); // 보라
        world.addObstacle(new Portal(w * 0.3, h * 0.75, w * 0.7, h * 0.88, PORTAL_COLORS[3]));  // 초록
        world.addObstacle(new Portal(w * 0.2, h * 0.62, w * 0.8, h * 0.38, PORTAL_COLORS[4]));  // 노랑

        // ===== 섹션 1 (0% ~ 15%) - 상단 범퍼 클러스터 =====
        world.addObstacle(new Bumper(w * 0.25, h * 0.03, 28));
        world.addObstacle(new Bumper(w * 0.4, h * 0.05, 24));
        world.addObstacle(new Bumper(w * 0.5, h * 0.02, 26));
        world.addObstacle(new Bumper(w * 0.6, h * 0.05, 24));
        world.addObstacle(new Bumper(w * 0.75, h * 0.03, 28));
        world.addObstacle(new Wall(5, h * 0.01, w * 0.12, h * 0.1, 8));
        world.addObstacle(new Wall(w - 5, h * 0.01, w * 0.88, h * 0.1, 8));
        world.addObstacle(new Spinner(w * 0.35, h * 0.08, 50, -3));
        world.addObstacle(new Spinner(w * 0.65, h * 0.08, 50, 3));

        // ===== 섹션 2 (15% ~ 30%) - 핀 + 스피너 =====
        for (let row = 0; row < 8; row++) {
            const cols = row % 2 === 0 ? 8 : 7;
            const baseOffsetX = row % 2 === 0 ? w / 16 : w / 16 + w / 16;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 8);
                const y = h * 0.12 + row * 38;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        world.addObstacle(new Spinner(w * 0.2, h * 0.18, 60, 2.5));
        world.addObstacle(new Spinner(w * 0.5, h * 0.16, 75, -3));
        world.addObstacle(new Spinner(w * 0.8, h * 0.18, 60, 2.5));
        world.addObstacle(new Bumper(w * 0.35, h * 0.22, 22));
        world.addObstacle(new Bumper(w * 0.65, h * 0.22, 22));

        // ===== 섹션 3 (30% ~ 45%) - 사이드 벽 + 범퍼 =====
        world.addObstacle(new Wall(5, h * 0.25, w * 0.15, h * 0.4, 8));
        world.addObstacle(new Wall(w - 5, h * 0.25, w * 0.85, h * 0.4, 8));
        world.addObstacle(new Bumper(w * 0.2, h * 0.28, 30));
        world.addObstacle(new Bumper(w * 0.4, h * 0.32, 26));
        world.addObstacle(new Bumper(w * 0.5, h * 0.28, 32));
        world.addObstacle(new Bumper(w * 0.6, h * 0.32, 26));
        world.addObstacle(new Bumper(w * 0.8, h * 0.28, 30));
        world.addObstacle(new Booster(w * 0.12, h * 0.35, -Math.PI / 4, 750));
        world.addObstacle(new Booster(w * 0.88, h * 0.35, -Math.PI * 3 / 4, 750));
        world.addObstacle(new Spinner(w * 0.5, h * 0.38, 85, 3));
        world.addObstacle(new Triangle(w * 0.3, h * 0.42, 28));
        world.addObstacle(new Triangle(w * 0.7, h * 0.42, 28));

        // ===== 섹션 4 (45% ~ 60%) - 스피너 미로 =====
        world.addObstacle(new Spinner(w * 0.15, h * 0.48, 55, -2.5));
        world.addObstacle(new Spinner(w * 0.3, h * 0.52, 60, 3));
        world.addObstacle(new Spinner(w * 0.5, h * 0.48, 70, -2.5));
        world.addObstacle(new Spinner(w * 0.7, h * 0.52, 60, 3));
        world.addObstacle(new Spinner(w * 0.85, h * 0.48, 55, -2.5));
        // 중간 부스터
        world.addObstacle(new Booster(w * 0.1, h * 0.52, -Math.PI / 4, 650));
        world.addObstacle(new Booster(w * 0.9, h * 0.52, -Math.PI * 3 / 4, 650));
        for (let row = 0; row < 5; row++) {
            const cols = row % 2 === 0 ? 6 : 5;
            const baseOffsetX = row % 2 === 0 ? w / 12 : w / 12 + w / 12;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 6);
                const y = h * 0.54 + row * 35;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        world.addObstacle(new Bumper(w * 0.25, h * 0.58, 24));
        world.addObstacle(new Bumper(w * 0.5, h * 0.56, 28));
        world.addObstacle(new Bumper(w * 0.75, h * 0.58, 24));
        world.addObstacle(new Booster(w * 0.5, h * 0.60, -Math.PI / 2, 550));

        // ===== 섹션 5 (60% ~ 75%) - 핀볼 플리퍼 존 =====
        world.addObstacle(new Wall(w * 0.1, h * 0.62, w * 0.25, h * 0.72, 6));
        world.addObstacle(new Wall(w * 0.9, h * 0.62, w * 0.75, h * 0.72, 6));
        world.addObstacle(new Triangle(w * 0.28, h * 0.68, 32, Math.PI / 6));
        world.addObstacle(new Triangle(w * 0.72, h * 0.68, 32, -Math.PI / 6));
        for (let row = 0; row < 6; row++) {
            const cols = row % 2 === 0 ? 7 : 6;
            const baseOffsetX = row % 2 === 0 ? w / 14 : w / 14 + w / 14;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 7);
                const y = h * 0.65 + row * 35;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        world.addObstacle(new Bumper(w * 0.4, h * 0.72, 24));
        world.addObstacle(new Bumper(w * 0.6, h * 0.72, 24));
        world.addObstacle(new Spinner(w * 0.5, h * 0.75, 70, -3));

        // ===== 섹션 6 (75% ~ 90%) - 최종 구간 =====
        world.addObstacle(new Bumper(w * 0.2, h * 0.8, 26));
        world.addObstacle(new Bumper(w * 0.35, h * 0.82, 22));
        world.addObstacle(new Bumper(w * 0.5, h * 0.78, 30));
        world.addObstacle(new Bumper(w * 0.65, h * 0.82, 22));
        world.addObstacle(new Bumper(w * 0.8, h * 0.8, 26));
        world.addObstacle(new Spinner(w * 0.25, h * 0.86, 50, 3));
        world.addObstacle(new Spinner(w * 0.75, h * 0.86, 50, -3));
        
        // 중간 부스터
        world.addObstacle(new Booster(w * 0.12, h * 0.84, -Math.PI / 3, 600));
        world.addObstacle(new Booster(w * 0.88, h * 0.84, -Math.PI * 2 / 3, 600));
        
        // 골 직전 부스터 라인 (위로 쏘는 부스터들!)
        world.addObstacle(new Booster(w * 0.15, h * 0.91, -Math.PI / 2, 600));
        world.addObstacle(new Booster(w * 0.3, h * 0.93, -Math.PI / 2, 700));
        world.addObstacle(new Booster(w * 0.5, h * 0.92, -Math.PI / 2, 750));
        world.addObstacle(new Booster(w * 0.7, h * 0.93, -Math.PI / 2, 700));
        world.addObstacle(new Booster(w * 0.85, h * 0.91, -Math.PI / 2, 600));
        
        world.addObstacle(new Triangle(w * 0.15, h * 0.96, 20, Math.PI / 4));
        world.addObstacle(new Triangle(w * 0.5, h * 0.97, 22));
        world.addObstacle(new Triangle(w * 0.85, h * 0.96, 20, -Math.PI / 4));
    },

    funnel(world, w, h) {
        // ===== 포탈 5쌍 (색상별) =====
        world.addObstacle(new Portal(w * 0.08, h * 0.06, w * 0.92, h * 0.2, PORTAL_COLORS[0]));  // 시안
        world.addObstacle(new Portal(w * 0.12, h * 0.32, w * 0.88, h * 0.48, PORTAL_COLORS[1])); // 핑크
        world.addObstacle(new Portal(w * 0.1, h * 0.55, w * 0.5, h * 0.7, PORTAL_COLORS[2]));   // 보라
        world.addObstacle(new Portal(w * 0.9, h * 0.72, w * 0.25, h * 0.88, PORTAL_COLORS[3])); // 초록
        world.addObstacle(new Portal(w * 0.3, h * 0.42, w * 0.7, h * 0.78, PORTAL_COLORS[4])); // 노랑

        // ===== 레이어 1 (0% ~ 15%) - 상단 깔때기 + 밀집 핀 필드 =====
        world.addObstacle(new Wall(5, h * 0.005, w * 0.18, h * 0.06, 6));
        world.addObstacle(new Wall(w - 5, h * 0.005, w * 0.82, h * 0.06, 6));
        world.addObstacle(new Spinner(w * 0.5, h * 0.03, 50, 3));
        
        // 첫 번째 핀 필드 - 8행으로 확장 (더 넓고 밀집)
        for (let row = 0; row < 8; row++) {
            const cols = row % 2 === 0 ? 8 : 7;
            const baseOffsetX = row % 2 === 0 ? w / 16 : w / 16 + w / 16;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 8);
                const y = h * 0.045 + row * 28;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        
        // 범퍼는 핀 필드 아래에 배치
        world.addObstacle(new Bumper(w * 0.25, h * 0.14, 18));
        world.addObstacle(new Bumper(w * 0.5, h * 0.13, 20));
        world.addObstacle(new Bumper(w * 0.75, h * 0.14, 18));

        // ===== 레이어 2 (15% ~ 26%) - 두 번째 깔때기 =====
        world.addObstacle(new Wall(w * 0.08, h * 0.15, w * 0.28, h * 0.22, 6));
        world.addObstacle(new Wall(w * 0.92, h * 0.15, w * 0.72, h * 0.22, 6));
        world.addObstacle(new Spinner(w * 0.25, h * 0.19, 50, -2.5));
        world.addObstacle(new Spinner(w * 0.75, h * 0.19, 50, 2.5));
        world.addObstacle(new Bumper(w * 0.5, h * 0.21, 22));
        world.addObstacle(new Triangle(w * 0.35, h * 0.24, 20));
        world.addObstacle(new Triangle(w * 0.65, h * 0.24, 20));

        // ===== 레이어 3 (26% ~ 38%) - 3갈래 분기 =====
        world.addObstacle(new Wall(w * 0.15, h * 0.26, w * 0.3, h * 0.36, 6));
        world.addObstacle(new Wall(w * 0.85, h * 0.26, w * 0.7, h * 0.36, 6));
        world.addObstacle(new Wall(w * 0.42, h * 0.28, w * 0.42, h * 0.35, 5));
        world.addObstacle(new Wall(w * 0.58, h * 0.28, w * 0.58, h * 0.35, 5));
        world.addObstacle(new Bumper(w * 0.28, h * 0.32, 16));
        world.addObstacle(new Bumper(w * 0.5, h * 0.30, 18));
        world.addObstacle(new Bumper(w * 0.72, h * 0.32, 16));
        world.addObstacle(new Spinner(w * 0.28, h * 0.37, 40, 3));
        world.addObstacle(new Spinner(w * 0.5, h * 0.38, 45, -2.5));
        world.addObstacle(new Spinner(w * 0.72, h * 0.37, 40, 3));
        // 분기점 부스터
        world.addObstacle(new Booster(w * 0.2, h * 0.36, -Math.PI / 3, 550));
        world.addObstacle(new Booster(w * 0.8, h * 0.36, -Math.PI * 2 / 3, 550));

        // ===== 레이어 4 (38% ~ 50%) - 범퍼 필드 + 핀 =====
        world.addObstacle(new Bumper(w * 0.15, h * 0.42, 18));
        world.addObstacle(new Bumper(w * 0.35, h * 0.44, 16));
        world.addObstacle(new Bumper(w * 0.5, h * 0.42, 20));
        world.addObstacle(new Bumper(w * 0.65, h * 0.44, 16));
        world.addObstacle(new Bumper(w * 0.85, h * 0.42, 18));
        world.addObstacle(new Booster(w * 0.1, h * 0.48, -Math.PI / 4, 700));
        world.addObstacle(new Booster(w * 0.5, h * 0.45, -Math.PI / 2, 600));
        world.addObstacle(new Booster(w * 0.9, h * 0.48, -Math.PI * 3 / 4, 700));
        // 핀 필드 - 6행으로 확장
        for (let row = 0; row < 6; row++) {
            const cols = row % 2 === 0 ? 7 : 6;
            const baseOffsetX = row % 2 === 0 ? w / 14 : w / 14 + w / 14;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 7);
                const y = h * 0.46 + row * 26;
                world.addObstacle(new Peg(x, y, 5));
            }
        }

        // ===== 레이어 5 (50% ~ 62%) - 스피너 존 =====
        world.addObstacle(new Spinner(w * 0.15, h * 0.54, 50, 3));
        world.addObstacle(new Spinner(w * 0.35, h * 0.57, 55, -2.5));
        world.addObstacle(new Spinner(w * 0.5, h * 0.54, 60, 3));
        world.addObstacle(new Spinner(w * 0.65, h * 0.57, 55, -2.5));
        world.addObstacle(new Spinner(w * 0.85, h * 0.54, 50, 3));
        world.addObstacle(new Booster(w * 0.25, h * 0.56, -Math.PI / 2, 500));
        world.addObstacle(new Booster(w * 0.75, h * 0.56, -Math.PI / 2, 500));
        world.addObstacle(new Wall(5, h * 0.58, w * 0.2, h * 0.64, 6));
        world.addObstacle(new Wall(w - 5, h * 0.58, w * 0.8, h * 0.64, 6));
        world.addObstacle(new Bumper(w * 0.35, h * 0.62, 16));
        world.addObstacle(new Bumper(w * 0.65, h * 0.62, 16));

        // ===== 레이어 6 (62% ~ 74%) - 핀 밀집 구간 =====
        for (let row = 0; row < 8; row++) {
            const cols = row % 2 === 0 ? 9 : 8;
            const baseOffsetX = row % 2 === 0 ? w / 18 : w / 18 + w / 18;
            for (let col = 0; col < cols; col++) {
                const x = baseOffsetX + col * (w / 9);
                const y = h * 0.64 + row * 30;
                world.addObstacle(new Peg(x, y, 5));
            }
        }
        world.addObstacle(new Spinner(w * 0.25, h * 0.70, 45, -2));
        world.addObstacle(new Spinner(w * 0.5, h * 0.68, 50, 2.5));
        world.addObstacle(new Spinner(w * 0.75, h * 0.70, 45, -2));
        // 레이어 6 하단 부스터
        world.addObstacle(new Booster(w * 0.15, h * 0.73, -Math.PI / 3, 600));
        world.addObstacle(new Booster(w * 0.85, h * 0.73, -Math.PI * 2 / 3, 600));

        // ===== 레이어 7 (74% ~ 86%) - 최종 깔때기 =====
        world.addObstacle(new Wall(w * 0.08, h * 0.76, w * 0.28, h * 0.84, 6));
        world.addObstacle(new Wall(w * 0.92, h * 0.76, w * 0.72, h * 0.84, 6));
        world.addObstacle(new Triangle(w * 0.32, h * 0.80, 20));
        world.addObstacle(new Triangle(w * 0.68, h * 0.80, 20));
        world.addObstacle(new Bumper(w * 0.5, h * 0.78, 20));
        world.addObstacle(new Spinner(w * 0.4, h * 0.84, 45, 2.5));
        world.addObstacle(new Spinner(w * 0.6, h * 0.84, 45, -2.5));
        // 중앙 부스터
        world.addObstacle(new Booster(w * 0.5, h * 0.82, -Math.PI / 2, 500));

        // ===== 레이어 8 (86% ~ 95%) - 최하단 =====
        world.addObstacle(new Bumper(w * 0.2, h * 0.88, 18));
        world.addObstacle(new Bumper(w * 0.35, h * 0.90, 16));
        world.addObstacle(new Bumper(w * 0.5, h * 0.87, 20));
        world.addObstacle(new Bumper(w * 0.65, h * 0.90, 16));
        world.addObstacle(new Bumper(w * 0.8, h * 0.88, 18));
        
        // 골 직전 부스터 라인 (위로 쏘는 부스터들!)
        world.addObstacle(new Booster(w * 0.12, h * 0.92, -Math.PI / 2, 600));
        world.addObstacle(new Booster(w * 0.28, h * 0.94, -Math.PI / 2, 700));
        world.addObstacle(new Booster(w * 0.5, h * 0.95, -Math.PI / 2, 750));
        world.addObstacle(new Booster(w * 0.72, h * 0.94, -Math.PI / 2, 700));
        world.addObstacle(new Booster(w * 0.88, h * 0.92, -Math.PI / 2, 600));
        
        world.addObstacle(new Spinner(w * 0.15, h * 0.96, 30, 3));
        world.addObstacle(new Spinner(w * 0.85, h * 0.96, 30, -3));
        world.addObstacle(new Triangle(w * 0.35, h * 0.97, 16));
        world.addObstacle(new Triangle(w * 0.65, h * 0.97, 16));
    }
};

// ===== Game Controller =====
class MarbleRoulette {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = null;
        this.participants = [];
        this.mapType = 'chaos';
        this.isRunning = false;
        this.animationId = null;
        this.lastTime = 0;
        this.gameStartTime = 0;
        this.firstWins = true;  // true: 먼저 들어온 순서가 1등, false: 나중에 들어온 순서가 1등
        
        // 기준 너비 (PC 기준)
        this.baseWidth = 600;

        this.colors = [
            '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff',
            '#5f27cd', '#00d2d3', '#ff6b9d', '#c8d6e5', '#10ac84',
            '#ee5a24', '#0abde3', '#f368e0', '#576574', '#01a3a4',
            '#9b59b6', '#3498db', '#e74c3c', '#2ecc71', '#f39c12'
        ];

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    // 화면 크기에 따른 스케일 계산
    getScale() {
        return Math.min(1, this.canvas.width / this.baseWidth);
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        
        if (!this.isRunning) {
            this.setupWorld();
            this.draw();
        }
    }

    setParticipants(participants) {
        this.participants = participants;
        if (!this.isRunning) {
            this.setupWorld();
            this.draw();
        }
    }

    setMap(mapType) {
        this.mapType = mapType;
        // 실행 중이면 리셋
        if (this.isRunning) {
            this.stop();
            document.getElementById('liveIndicator').style.display = 'none';
            document.getElementById('rankingList').innerHTML = '<div class="ranking-placeholder">게임을 시작하면 순위가 표시됩니다</div>';
        }
        this.setupWorld();
        this.draw();
    }

    shuffle() {
        for (let i = this.participants.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.participants[i], this.participants[j]] = [this.participants[j], this.participants[i]];
        }
        this.setupWorld();
        this.draw();
    }

    setupWorld() {
        const w = this.canvas.width;
        const viewH = this.canvas.height;
        const scale = this.getScale();

        this.world = new PhysicsWorld(w, viewH);

        // Apply selected map (world.height는 viewH * 3)
        if (MapGenerators[this.mapType]) {
            MapGenerators[this.mapType](this.world, w, this.world.height);
        }
        
        // 핀 위치 수집
        const pegs = this.world.obstacles.filter(o => o.type === 'peg');
        
        // 모든 장애물에 스케일 적용 + 크기 제한
        for (const obs of this.world.obstacles) {
            if (obs.radius) {
                obs.radius *= scale;
                // 범퍼 최대 크기 제한 (기존의 80%)
                if (obs.type === 'bumper') {
                    obs.radius = Math.min(obs.radius, 24 * scale);
                }
            }
            if (obs.length) {
                obs.length *= scale;
                // 스피너 최대 길이 1.5배 증가
                if (obs.type === 'spinner') {
                    obs.length = Math.min(obs.length * 1.5, 120 * scale);
                }
            }
            // 삼각형 크기 제한 (기존의 80%)
            if (obs.type === 'triangle' && obs.size) {
                obs.size *= scale;
                obs.size = Math.min(obs.size, 22 * scale);
            }
        }
        
        // 핀 영역과 겹치는 범퍼/삼각형 제거
        const minClearance = 35 * scale;  // 핀과 유지해야 할 최소 거리
        this.world.obstacles = this.world.obstacles.filter(obs => {
            if (obs.type !== 'bumper' && obs.type !== 'triangle') return true;
            
            // 모든 핀과의 거리 체크
            for (const peg of pegs) {
                const dx = obs.x - peg.x;
                const dy = obs.y - peg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const obsSize = obs.radius || obs.size || 20;
                
                if (dist < peg.radius + obsSize + minClearance) {
                    return false;  // 너무 가까우면 제거
                }
            }
            return true;
        });

        // Create balls - 스케일 적용 + 초기 속도
        const baseBallRadius = Math.max(10, Math.min(18, 250 / Math.max(1, this.participants.length)));
        const ballRadius = baseBallRadius * scale;
        const startArea = w * 0.6;
        const startX = (w - startArea) / 2;
        const initialVelY = 150 + Math.random() * 100;  // 초기 하향 속도

        this.participants.forEach((name, i) => {
            const x = startX + Math.random() * startArea;
            const y = -20 - Math.random() * 80 - i * 8;
            const color = this.colors[i % this.colors.length];
            this.world.addBall(new Ball(x, y, ballRadius, color, name, initialVelY));
        });
    }

    start() {
        if (this.participants.length === 0) return;
        
        this.isRunning = true;
        this.setupWorld();
        this.gameStartTime = performance.now();
        this.lastTime = performance.now();
        this.animate();

        document.getElementById('rankingList').innerHTML = '<div class="ranking-placeholder">첫 번째 도착자를 기다리는 중...</div>';
        document.getElementById('liveIndicator').style.display = 'flex';
        
        // 버튼 텍스트 변경
        document.getElementById('resetBtn').textContent = '⏹ 종료';
        document.getElementById('resetBtn').classList.add('btn-danger');
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }
    
    // 게임 강제 종료 (현재 위치 기준 순위 결정)
    forceEnd() {
        if (!this.isRunning) {
            this.reset();
            return;
        }
        
        const now = performance.now();
        
        // 아직 도착 안 한 공들을 Y 위치(진행도) 기준으로 정렬
        const racingBalls = this.world.balls.filter(b => !b.finished);
        racingBalls.sort((a, b) => b.pos.y - a.pos.y);  // Y가 큰 순서 (더 앞서 있는 순서)
        
        // 진행도 순서대로 rankings에 추가
        racingBalls.forEach(ball => {
            ball.finished = true;
            ball.finishTime = now;
            ball.timedOut = true;
            ball.progress = (ball.pos.y / this.world.finishLine) * 100;
            this.world.rankings.push(ball);
        });
        
        this.isRunning = false;
        this.showWinner(true);
    }

    reset() {
        this.stop();
        this.setupWorld();
        this.draw();
        document.getElementById('rankingList').innerHTML = '<div class="ranking-placeholder">게임을 시작하면 순위가 표시됩니다</div>';
        document.getElementById('liveIndicator').style.display = 'none';
        document.getElementById('winnerOverlay').classList.remove('show');
        
        // 버튼 텍스트 복원
        document.getElementById('resetBtn').textContent = '↺ 초기화';
        document.getElementById('resetBtn').classList.remove('btn-danger');
    }

    animate() {
        if (!this.isRunning) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.016);
        this.lastTime = now;

        this.world.update(dt);
        this.updateRankings();
        this.draw();

        // 60초 타임아웃 체크
        const elapsed = (performance.now() - this.gameStartTime) / 1000;
        if (elapsed >= 60) {
            this.isRunning = false;
            this.finishByTimeout();
            return;
        }
        
        if (this.world.isFinished()) {
            this.isRunning = false;
            this.showWinner();
            return;
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // 타임아웃으로 게임 종료 - 진행도 기준 순위 결정
    finishByTimeout() {
        const now = performance.now();
        
        // 아직 도착 안 한 공들을 Y 위치(진행도) 기준으로 정렬
        const racingBalls = this.world.balls.filter(b => !b.finished);
        racingBalls.sort((a, b) => b.pos.y - a.pos.y);  // Y가 큰 순서 (더 앞서 있는 순서)
        
        // 진행도 순서대로 rankings에 추가 (타임아웃으로 종료됨을 표시)
        racingBalls.forEach(ball => {
            ball.finished = true;
            ball.finishTime = now;
            ball.timedOut = true;  // 타임아웃 플래그
            ball.progress = (ball.pos.y / this.world.finishLine) * 100;  // 진행률 저장
            this.world.rankings.push(ball);
        });
        
        this.showWinner(true);  // 타임아웃 플래그 전달
    }

    updateRankings() {
        const list = document.getElementById('rankingList');
        const medals = ['🥇', '🥈', '🥉'];
        const totalParticipants = this.world.balls.length;
        const finishedBalls = [...this.world.rankings];  // 도착한 공들 (도착 순서대로)
        const racingBalls = this.world.balls.filter(b => !b.finished);  // 진행 중인 공들
        
        let html = '';
        
        if (this.firstWins) {
            // ===== 먼저 들어온 순서가 1등 =====
            // 진행 중인 공들을 Y 위치 기준 정렬 (Y 큰 것이 앞서 있음)
            const sortedRacing = [...racingBalls].sort((a, b) => b.pos.y - a.pos.y);
            
            // 1. 도착한 공들 먼저 표시
            const firstTime = finishedBalls[0]?.finishTime || 0;
            const firstTimeInSec = firstTime ? (firstTime - this.gameStartTime) / 1000 : 0;
            
            finishedBalls.forEach((ball, i) => {
                const rankClass = i < 3 ? `rank-${i + 1}` : '';
                const ballTimeInSec = (ball.finishTime - this.gameStartTime) / 1000;
                let timeDisplay;
                if (i === 0) {
                    timeDisplay = `${ballTimeInSec.toFixed(2)}s`;
                } else {
                    const diff = ballTimeInSec - firstTimeInSec;
                    timeDisplay = `+${diff.toFixed(2)}s`;
                }
                
                html += `
                    <div class="ranking-item ${rankClass}">
                        <div class="ranking-position">${i + 1}</div>
                        <div class="ranking-color" style="background: ${ball.color};"></div>
                        <div class="ranking-name">${ball.name}</div>
                        ${i < 3 ? `<span class="ranking-medal">${medals[i]}</span>` : ''}
                        <span class="ranking-time">${timeDisplay}</span>
                    </div>
                `;
            });
            
            // 2. 진행 중인 공들 표시
            if (sortedRacing.length > 0) {
                if (finishedBalls.length > 0) {
                    html += `<div class="ranking-separator">— 레이싱 중 —</div>`;
                }
                
                sortedRacing.forEach((ball, i) => {
                    const overallRank = finishedBalls.length + i + 1;
                    const rankClass = overallRank <= 3 ? `rank-${overallRank}` : '';
                    const progress = Math.min(100, Math.max(0, 
                        (ball.pos.y / this.world.finishLine) * 100
                    )).toFixed(0);
                    
                    html += `
                        <div class="ranking-item racing ${rankClass}">
                            <div class="ranking-position">${overallRank}</div>
                            <div class="ranking-color" style="background: ${ball.color};"></div>
                            <div class="ranking-name">${ball.name}</div>
                            ${overallRank <= 3 ? `<span class="ranking-medal">${medals[overallRank-1]}</span>` : ''}
                            <span class="ranking-progress">${progress}%</span>
                        </div>
                    `;
                });
            }
        } else {
            // ===== 늦게 들어온 순서가 1등 =====
            // 진행 중인 공들을 Y 위치 기준 정렬 (Y 작은 것이 1등에 가까움 - 아직 덜 내려온 것)
            const sortedRacing = [...racingBalls].sort((a, b) => a.pos.y - b.pos.y);
            
            // 1. 진행 중인 공들 먼저 표시 (아직 도착 안 한 공이 상위)
            sortedRacing.forEach((ball, i) => {
                const rank = i + 1;
                const rankClass = rank <= 3 ? `rank-${rank}` : '';
                const progress = Math.min(100, Math.max(0, 
                    (ball.pos.y / this.world.finishLine) * 100
                )).toFixed(0);
                
                html += `
                    <div class="ranking-item racing ${rankClass}">
                        <div class="ranking-position">${rank}</div>
                        <div class="ranking-color" style="background: ${ball.color};"></div>
                        <div class="ranking-name">${ball.name}</div>
                        ${rank <= 3 ? `<span class="ranking-medal">${medals[rank-1]}</span>` : ''}
                        <span class="ranking-progress">${progress}%</span>
                    </div>
                `;
            });
            
            // 2. 도착한 공들 표시 (도착한 순서 역순 = 먼저 도착한 게 꼴찌)
            if (finishedBalls.length > 0) {
                if (racingBalls.length > 0) {
                    html += `<div class="ranking-separator">— 순위 확정 —</div>`;
                }
                
                // 도착한 공들을 뒤집어서 표시 (먼저 도착한 게 제일 아래)
                const reversedFinished = [...finishedBalls].reverse();
                
                reversedFinished.forEach((ball, i) => {
                    // 순위: 레이싱 중인 공 수 + i + 1 (먼저 도착한 게 뒤 순위)
                    const rank = racingBalls.length + i + 1;
                    const isLast = rank === totalParticipants;
                    let rankClass = '';
                    if (rank <= 3) rankClass = `rank-${rank}`;
                    else if (isLast) rankClass = 'rank-last';
                    
                    const ballTimeInSec = (ball.finishTime - this.gameStartTime) / 1000;
                    const timeDisplay = `${ballTimeInSec.toFixed(2)}s`;
                    
                    html += `
                        <div class="ranking-item ${rankClass}">
                            <div class="ranking-position">${rank}</div>
                            <div class="ranking-color" style="background: ${ball.color};"></div>
                            <div class="ranking-name">${ball.name}</div>
                            ${rank <= 3 ? `<span class="ranking-medal">${medals[rank-1]}</span>` : ''}
                            ${isLast ? `<span class="ranking-medal">💀</span>` : ''}
                            <span class="ranking-time">${timeDisplay}</span>
                        </div>
                    `;
                });
            }
        }
        
        // 아무도 없으면
        if (html === '') {
            html = '<div class="ranking-placeholder">게임을 시작하면 순위가 표시됩니다</div>';
        }
        
        list.innerHTML = html;
    }

    showWinner(isTimeout = false) {
        let rankings = [...this.world.rankings];
        
        // firstWins가 false면 순위 뒤집기
        if (!this.firstWins) {
            rankings = rankings.reverse();
        }
        
        const winner = rankings[0];

        // 타임아웃인 경우 다른 메시지 표시
        if (isTimeout && winner.timedOut) {
            document.getElementById('winnerLabel').textContent = '⏱️ 시간 초과!';
        } else {
            document.getElementById('winnerLabel').textContent = '🏆 1등!';
        }
        document.getElementById('winnerName').textContent = winner.name;
        
        // 전체 순위 표시
        const finalList = document.getElementById('finalRankingList');
        finalList.innerHTML = '';
        
        const medals = ['🥇', '🥈', '🥉'];
        
        // 첫 번째로 정상 도착한 공 찾기 (표시용)
        const firstFinisher = rankings.find(b => !b.timedOut);
        const firstTimeInSec = firstFinisher 
            ? (firstFinisher.finishTime - this.gameStartTime) / 1000 
            : 60;

        // 결과 텍스트 생성 (복사용)
        this.lastResultText = `🏅 구슬 올림픽 결과\n`;
        this.lastResultText += `${this.firstWins ? '(먼저 도착 = 1등)' : '(나중 도착 = 1등)'}\n\n`;

        rankings.forEach((ball, i) => {
            const item = document.createElement('div');
            const isLast = i === rankings.length - 1;
            let rankClass = '';
            if (i < 3) rankClass = `rank-${i + 1}`;
            else if (isLast && rankings.length > 3) rankClass = 'rank-last';
            
            // 타임아웃된 공은 추가 클래스
            if (ball.timedOut) rankClass += ' timed-out';
            
            item.className = `final-ranking-item ${rankClass}`;
            item.style.animationDelay = `${i * 0.08}s`;
            
            // 시간/진행도 표시
            let timeDisplay;
            if (ball.timedOut) {
                timeDisplay = `${ball.progress.toFixed(0)}%`;
            } else {
                const ballTimeInSec = (ball.finishTime - this.gameStartTime) / 1000;
                if (i === 0 || !firstFinisher) {
                    timeDisplay = `${ballTimeInSec.toFixed(2)}s`;
                } else {
                    const diff = Math.abs(ballTimeInSec - firstTimeInSec);
                    timeDisplay = this.firstWins 
                        ? `${ballTimeInSec.toFixed(2)}s (+${diff.toFixed(2)}s)`
                        : `${ballTimeInSec.toFixed(2)}s (-${diff.toFixed(2)}s)`;
                }
            }
            
            let medal = '';
            let medalText = '';
            if (i < 3) { medal = medals[i]; medalText = medals[i]; }
            else if (isLast && rankings.length > 3) { medal = '💀'; medalText = '💀'; }
            
            // 타임아웃된 공은 아이콘 추가
            const timeoutIcon = ball.timedOut ? '⏱️ ' : '';
            
            item.innerHTML = `
                <div class="final-position">${i + 1}</div>
                <div class="final-color" style="background: ${ball.color}"></div>
                <div class="final-name">${timeoutIcon}${ball.name}</div>
                <span class="final-time">${timeDisplay}</span>
                <span class="final-medal">${medal}</span>
            `;
            finalList.appendChild(item);
            
            // 결과 텍스트에 추가
            this.lastResultText += `${i + 1}위 ${medalText} ${ball.name} - ${timeDisplay}\n`;
        });

        document.getElementById('winnerOverlay').classList.add('show');
        document.getElementById('liveIndicator').style.display = 'none';
        
        // 하단 결과 복사 버튼 활성화
        const copyBtn2 = document.getElementById('copyResultBtn2');
        if (copyBtn2) copyBtn2.disabled = false;

        this.createConfetti();
    }
    
    // 토스트 알림 표시
    showToast(message = '클립보드에 복사되었습니다!') {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');
        toastMessage.textContent = message;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // 결과 복사
    copyResult(targetBtn = null) {
        if (!this.lastResultText) return;
        
        navigator.clipboard.writeText(this.lastResultText).then(() => {
            // 모달 내 버튼
            const btn = document.getElementById('copyResultBtn');
            const originalText = btn.textContent;
            btn.textContent = '✅ 복사됨!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
            
            // 하단 버튼 (아이콘만)
            const btn2 = document.getElementById('copyResultBtn2');
            if (btn2) {
                const originalIcon = btn2.textContent;
                btn2.textContent = '✅';
                setTimeout(() => {
                    btn2.textContent = originalIcon;
                }, 2000);
            }
            
            // 토스트 알림 표시
            this.showToast('결과가 클립보드에 복사되었습니다!');
        }).catch(err => {
            console.error('복사 실패:', err);
            this.showToast('복사에 실패했습니다.');
        });
    }

    createConfetti() {
        const container = document.getElementById('confettiContainer');
        container.innerHTML = '';

        const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d', '#a855f7'];
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
            if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
            container.appendChild(confetti);
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = 'rgba(10, 10, 18, 0.97)';
        ctx.fillRect(0, 0, w, h);

        if (!this.world) return;

        // 카메라 오프셋 적용
        const camY = this.world.cameraY || 0;
        ctx.save();
        ctx.translate(0, -camY);

        // Draw finish line (월드 좌표)
        const finishLineY = this.world.finishLine;
        const gradient = ctx.createLinearGradient(0, finishLineY, 0, finishLineY + 100);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.08)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, finishLineY, w, 100);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, finishLineY);
        ctx.lineTo(w, finishLineY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = 'bold 12px "Noto Sans KR"';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right';
        ctx.fillText('🏆 GOAL', w - 15, finishLineY - 8);

        // Draw obstacles
        for (const obs of this.world.obstacles) {
            this.drawObstacle(obs);
        }

        // Draw balls
        for (const ball of this.world.balls) {
            this.drawBall(ball);
        }

        ctx.restore();
        
        // UI 오버레이 (카메라 영향 안 받음)
        this.drawTimer();
    }
    
    drawTimer() {
        if (!this.world || !this.isRunning) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        
        // 경과 시간 계산
        const elapsed = (performance.now() - this.gameStartTime) / 1000;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        const ms = Math.floor((elapsed % 1) * 100);
        
        // 시간 포맷
        const timeStr = minutes > 0 
            ? `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
            : `${seconds}.${ms.toString().padStart(2, '0')}s`;
        
        // 배경 박스
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(w / 2 - 60, 8, 120, 28, 8);
        ctx.fill();
        
        // 테두리
        ctx.strokeStyle = elapsed >= 50 ? 'rgba(255, 107, 107, 0.5)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(w / 2 - 60, 8, 120, 28, 8);
        ctx.stroke();
        
        // 시간 텍스트
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = elapsed >= 50 ? '#ff6b6b' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⏱ ${timeStr}`, w / 2, 22);
        
        // 50초 이후 경고
        if (elapsed >= 50 && elapsed < 60) {
            ctx.font = 'bold 10px "Noto Sans KR"';
            ctx.fillStyle = '#ff6b6b';
            ctx.fillText(`${Math.ceil(60 - elapsed)}초 남음`, w / 2, 46);
        }
    }

    drawObstacle(obs) {
        const ctx = this.ctx;
        const time = this.world ? this.world.time : 0;

        if (obs.type === 'peg') {
            ctx.fillStyle = obs.color;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'bumper') {
            const scale = 1 + Math.max(0, 0.3 - (time - obs.hitTime)) * 0.5;
            const glow = ctx.createRadialGradient(obs.x, obs.y, 0, obs.x, obs.y, obs.radius * scale * 1.5);
            glow.addColorStop(0, obs.color);
            glow.addColorStop(0.6, obs.color + '80');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius * scale * 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = obs.color;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius * scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, obs.radius * 0.25, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'spinner') {
            const ep = obs.getEndpoints();
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(ep.x1, ep.y1);
            ctx.lineTo(ep.x2, ep.y2);
            ctx.stroke();

            // Center pivot
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (obs.type === 'portal') {
            // Draw both portal ends
            for (const [px, py] of [[obs.x1, obs.y1], [obs.x2, obs.y2]]) {
                const pulse = 1 + Math.sin(time * 4) * 0.1;
                const glow = ctx.createRadialGradient(px, py, 0, px, py, obs.radius * pulse * 1.5);
                glow.addColorStop(0, obs.color);
                glow.addColorStop(0.5, obs.color + '60');
                glow.addColorStop(1, 'transparent');
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(px, py, obs.radius * pulse * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = obs.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(px, py, obs.radius * pulse, 0, Math.PI * 2);
                ctx.stroke();

                // Inner swirl
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let a = 0; a < Math.PI * 2; a += 0.1) {
                    const r = obs.radius * 0.6 * (1 - a / (Math.PI * 2));
                    const x = px + Math.cos(a + time * 3) * r;
                    const y = py + Math.sin(a + time * 3) * r;
                    if (a === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else if (obs.type === 'booster') {
            const scale = 1 + Math.max(0, 0.2 - (time - obs.hitTime)) * 0.4;
            
            ctx.fillStyle = obs.color;
            ctx.beginPath();
            ctx.arc(obs.x, obs.y, obs.radius * scale, 0, Math.PI * 2);
            ctx.fill();

            // Arrow
            ctx.save();
            ctx.translate(obs.x, obs.y);
            ctx.rotate(obs.angle);
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(obs.radius * 0.6, 0);
            ctx.lineTo(-obs.radius * 0.3, -obs.radius * 0.4);
            ctx.lineTo(-obs.radius * 0.3, obs.radius * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (obs.type === 'wall') {
            ctx.strokeStyle = obs.color;
            ctx.lineWidth = obs.thickness;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(obs.x1, obs.y1);
            ctx.lineTo(obs.x2, obs.y2);
            ctx.stroke();
        } else if (obs.type === 'triangle') {
            const verts = obs.getVertices();
            ctx.fillStyle = obs.color;
            ctx.beginPath();
            ctx.moveTo(verts[0].x, verts[0].y);
            for (let i = 1; i < verts.length; i++) {
                ctx.lineTo(verts[i].x, verts[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    drawBall(ball) {
        const ctx = this.ctx;

        // Trail
        if (ball.trail.length > 1) {
            ctx.strokeStyle = ball.color + '40';
            ctx.lineWidth = ball.radius * 0.8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
            for (let i = 1; i < ball.trail.length; i++) {
                ctx.lineTo(ball.trail[i].x, ball.trail[i].y);
            }
            ctx.stroke();
        }

        // Glow
        const glowGradient = ctx.createRadialGradient(
            ball.pos.x, ball.pos.y, 0,
            ball.pos.x, ball.pos.y, ball.radius * 2
        );
        glowGradient.addColorStop(0, ball.color + '60');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Ball body
        const ballGradient = ctx.createRadialGradient(
            ball.pos.x - ball.radius * 0.3, ball.pos.y - ball.radius * 0.3, 0,
            ball.pos.x, ball.pos.y, ball.radius
        );
        ballGradient.addColorStop(0, '#ffffff');
        ballGradient.addColorStop(0.3, ball.color);
        ballGradient.addColorStop(1, this.darkenColor(ball.color, 40));
        
        ctx.fillStyle = ballGradient;
        ctx.beginPath();
        ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        // Name - 구슬 오른쪽에 왼쪽 정렬로 표시
        ctx.font = `bold ${Math.max(9, ball.radius * 0.7)}px "Noto Sans KR"`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        
        const shortName = ball.name.length > 6 ? ball.name.slice(0, 5) + '..' : ball.name;
        const textX = ball.pos.x + ball.radius + 4;  // 구슬 오른쪽으로 약간 띄움
        ctx.strokeText(shortName, textX, ball.pos.y);  // 외곽선 먼저
        ctx.fillText(shortName, textX, ball.pos.y);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}

// ===== Main =====
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new MarbleRoulette(canvas);

    const participantsInput = document.getElementById('participants');
    const mapSelect = document.getElementById('mapSelect');
    const firstWinsToggle = document.getElementById('firstWinsToggle');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const closeWinnerBtn = document.getElementById('closeWinnerBtn');
    const copyResultBtn = document.getElementById('copyResultBtn');
    const copyResultBtn2 = document.getElementById('copyResultBtn2');
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    function parseParticipants(text) {
        const lines = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const participants = [];

        for (const line of lines) {
            const match = line.match(/^(.+?)\*(\d+)$/);
            if (match) {
                const name = match[1].trim();
                const count = parseInt(match[2], 10);
                for (let i = 0; i < count; i++) participants.push(name);
            } else {
                participants.push(line);
            }
        }
        return participants;
    }

    function updateGame() {
        const participants = parseParticipants(participantsInput.value);
        game.setParticipants(participants);
    }
    
    // localStorage 키
    const STORAGE_KEY_PARTICIPANTS = 'marble-olympics-participants';
    const STORAGE_KEY_MAP = 'marble-olympics-map';
    const STORAGE_KEY_FIRST_WINS = 'marble-olympics-first-wins';
    
    // 저장된 값 불러오기
    function loadSavedData() {
        try {
            const savedParticipants = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
            const savedMap = localStorage.getItem(STORAGE_KEY_MAP);
            const savedFirstWins = localStorage.getItem(STORAGE_KEY_FIRST_WINS);
            
            if (savedParticipants) {
                participantsInput.value = savedParticipants;
                updateGame();
            }
            
            if (savedMap && ['chaos', 'pinball', 'funnel'].includes(savedMap)) {
                mapSelect.value = savedMap;
                game.setMap(savedMap);
            }
            
            if (savedFirstWins !== null) {
                const firstWins = savedFirstWins === 'true';
                firstWinsToggle.checked = firstWins;
                game.firstWins = firstWins;
                // 라벨 업데이트
                const label = document.getElementById('firstWinsLabel');
                label.textContent = firstWins ? '먼저 들어온 순서가 1등' : '늦게 들어온 순서가 1등';
            }
        } catch (e) {
            console.warn('localStorage 불러오기 실패:', e);
        }
    }
    
    // 참여자 저장
    function saveParticipants() {
        try {
            localStorage.setItem(STORAGE_KEY_PARTICIPANTS, participantsInput.value);
        } catch (e) {
            console.warn('localStorage 저장 실패:', e);
        }
    }
    
    // 맵 선택 저장
    function saveMap() {
        try {
            localStorage.setItem(STORAGE_KEY_MAP, mapSelect.value);
        } catch (e) {
            console.warn('localStorage 저장 실패:', e);
        }
    }
    
    // firstWins 저장
    function saveFirstWins() {
        try {
            localStorage.setItem(STORAGE_KEY_FIRST_WINS, firstWinsToggle.checked.toString());
        } catch (e) {
            console.warn('localStorage 저장 실패:', e);
        }
    }

    participantsInput.addEventListener('input', () => {
        updateGame();
        saveParticipants();
    });

    // 맵 선택 드롭다운
    mapSelect.addEventListener('change', () => {
        game.setMap(mapSelect.value);
        saveMap();
    });
    
    // firstWins 토글 텍스트 업데이트 함수
    function updateFirstWinsLabel() {
        const label = document.getElementById('firstWinsLabel');
        if (firstWinsToggle.checked) {
            label.textContent = '먼저 들어온 순서가 1등';
        } else {
            label.textContent = '늦게 들어온 순서가 1등';
        }
    }
    
    // firstWins 토글
    firstWinsToggle.addEventListener('change', () => {
        game.firstWins = firstWinsToggle.checked;
        updateFirstWinsLabel();
        saveFirstWins();
        
        // 게임 중이면 초기화
        if (game.isRunning) {
            game.reset();
        }
    });

    // 도움말 모달
    helpBtn.addEventListener('click', () => {
        helpModal.classList.add('show');
    });

    closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('show');
    });

    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.classList.remove('show');
        }
    });

    shuffleBtn.addEventListener('click', () => {
        if (game.participants.length > 0) {
            game.shuffle();
            updateGame();
        }
    });

    startBtn.addEventListener('click', () => {
        const participants = parseParticipants(participantsInput.value);
        if (participants.length < 2) {
            alert('최소 2명 이상의 참여자가 필요합니다!');
            return;
        }
        game.setParticipants(participants);
        game.start();
    });

    resetBtn.addEventListener('click', () => game.forceEnd());
    
    closeWinnerBtn.addEventListener('click', () => {
        document.getElementById('winnerOverlay').classList.remove('show');
    });
    
    copyResultBtn.addEventListener('click', () => {
        game.copyResult();
    });
    
    copyResultBtn2.addEventListener('click', () => {
        game.copyResult(copyResultBtn2);
    });

    // Initial setup
    loadSavedData();  // 저장된 참여자/맵 불러오기
    game.setupWorld();
    game.draw();
    document.getElementById('rankingList').innerHTML = '<div class="ranking-placeholder">게임을 시작하면 순위가 표시됩니다</div>';
});
