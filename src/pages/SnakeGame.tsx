import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Pause, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Cell = { x: number; y: number };

const GRID = 20;
const INITIAL_SNAKE: Cell[] = [{ x: 10, y: 10 }];
const INITIAL_FOOD: Cell = { x: 15, y: 10 };
const SPEED = 120;

const randomFood = (snake: Cell[]): Cell => {
  while (true) {
    const f = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    if (!snake.some((s) => s.x === f.x && s.y === f.y)) return f;
  }
};

const SnakeGame = () => {
  const [snake, setSnake] = useState<Cell[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Cell>(INITIAL_FOOD);
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => Number(localStorage.getItem("snake_best") || 0));
  const dirRef = useRef<Dir>("RIGHT");

  const setDirection = useCallback((next: Dir) => {
    const opp: Record<Dir, Dir> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (opp[dirRef.current] === next) return;
    dirRef.current = next;
    setDir(next);
  }, []);

  const reset = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDir("RIGHT");
    dirRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setRunning(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT",
        w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT",
      };
      const next = map[e.key];
      if (next) {
        e.preventDefault();
        setDirection(next);
        if (!running && !gameOver) setRunning(true);
      }
      if (e.key === " ") setRunning((r) => !r);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, gameOver, setDirection]);

  useEffect(() => {
    if (!running || gameOver) return;
    const id = setInterval(() => {
      setSnake((prev) => {
        const head = prev[0];
        const d = dirRef.current;
        const nh: Cell = {
          x: head.x + (d === "LEFT" ? -1 : d === "RIGHT" ? 1 : 0),
          y: head.y + (d === "UP" ? -1 : d === "DOWN" ? 1 : 0),
        };
        if (nh.x < 0 || nh.y < 0 || nh.x >= GRID || nh.y >= GRID || prev.some((s) => s.x === nh.x && s.y === nh.y)) {
          setGameOver(true);
          setRunning(false);
          setBest((b) => {
            const nb = Math.max(b, prev.length - 1);
            localStorage.setItem("snake_best", String(nb));
            return nb;
          });
          return prev;
        }
        const ate = nh.x === food.x && nh.y === food.y;
        const next = [nh, ...prev];
        if (!ate) next.pop();
        else {
          setScore((s) => s + 10);
          setFood(randomFood(next));
        }
        return next;
      });
    }, SPEED);
    return () => clearInterval(id);
  }, [running, gameOver, food]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
          <h1 className="text-2xl font-bold">🐍 Snake</h1>
          <div className="w-12" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className="text-2xl font-bold text-accent">{score}</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-xs text-muted-foreground">Best</div>
            <div className="text-2xl font-bold">{best}</div>
          </Card>
        </div>

        <Card className="relative aspect-square w-full overflow-hidden border-2 border-accent/30 bg-primary">
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)`, gridTemplateRows: `repeat(${GRID}, 1fr)` }}
          >
            {Array.from({ length: GRID * GRID }).map((_, i) => {
              const x = i % GRID;
              const y = Math.floor(i / GRID);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isBody = !isHead && snake.some((s) => s.x === x && s.y === y);
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={
                    isHead ? "bg-accent rounded-sm shadow-lg shadow-accent/50"
                    : isBody ? "bg-accent/70 rounded-sm"
                    : isFood ? "bg-destructive rounded-full scale-75 animate-pulse"
                    : ""
                  }
                />
              );
            })}
          </div>

          {(gameOver || (!running && score === 0)) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/80 backdrop-blur-sm">
              <div className="text-primary-foreground text-3xl font-bold mb-2">
                {gameOver ? "Game Over" : "Snake"}
              </div>
              <div className="text-primary-foreground/70 mb-4 text-sm">
                {gameOver ? `Final score: ${score}` : "Arrow keys / swipe to play"}
              </div>
              <Button onClick={() => { if (gameOver) reset(); setRunning(true); }} size="lg">
                <Play className="mr-2 h-4 w-4" /> {gameOver ? "Play Again" : "Start"}
              </Button>
            </div>
          )}
        </Card>

        <div className="flex gap-2 mt-4 justify-center">
          <Button variant="outline" size="sm" onClick={() => setRunning((r) => !r)} disabled={gameOver}>
            {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Touch controls */}
        <div className="mt-6 grid grid-cols-3 gap-2 max-w-[240px] mx-auto md:hidden">
          <div />
          <Button variant="secondary" size="lg" onClick={() => setDirection("UP")}><ArrowUp /></Button>
          <div />
          <Button variant="secondary" size="lg" onClick={() => setDirection("LEFT")}><ArrowLeft /></Button>
          <Button variant="secondary" size="lg" onClick={() => setDirection("DOWN")}><ArrowDown /></Button>
          <Button variant="secondary" size="lg" onClick={() => setDirection("RIGHT")}><ArrowRight /></Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Desktop: Arrow keys or WASD · Space to pause
        </p>
      </div>
    </div>
  );
};

export default SnakeGame;
