// client-side rendered
"use client";

import { useEffect, useCallback, useRef, useState } from "react";

export default function Canvas() {
	// update canvas without rerender -> useref
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [frames, setFrames] = useState<string[]>([""]);
	const [currentFrame, setCurrentFrame] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const [frameRate, setFrameRate] = useState<number>(24);
	// update frame using current data on canvas
	const updateFrame = useCallback(
		() => {
			const canvas = canvasRef.current;
			if (!canvas) return;
			// read the curr frame
			const imageData = canvas.toDataURL();

			setFrames((prevFrames) => {
				const newFrames = [...prevFrames]; 
				newFrames[currentFrame] = imageData;
				return newFrames;
			});
		}, [currentFrame]
	);

	// load frame from base64
	const loadFrame = useCallback(
		(index: number) => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const ctx = canvas.getContext("2d");
			const image = new Image();
			image.src = frames[index] || ""; 

			// use callback to draw from array
			image.onload = () => {
				// optional chain
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(image, 0, 0);
			};
		}, [frames]
	);

	useEffect(() => {
		// canvas context allows us to manipulate
		const canvas = canvasRef.current;
		if (!canvas) return;
		// the canvas
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// modify context to get a more pixel
		ctx.lineWidth = 5;
		ctx.lineCap = "square";
		ctx.lineJoin = "miter";
		ctx.strokeStyle = "black";

		loadFrame(currentFrame);

		// handlers to draw 
		const startDrawing = (e: MouseEvent) => {
			ctx.beginPath();
			ctx.moveTo(e.offsetX, e.offsetY);
			setIsDrawing(true);
		};

		const draw = (e: MouseEvent) => {
			if (!isDrawing) return;
			ctx.lineTo(e.offsetX, e.offsetY);
			ctx.stroke();	
		};

		const stopDrawing = () => {
			setIsDrawing(false);
			ctx.closePath();
			updateFrame();
		};

		// apply handlers
		canvas.addEventListener("mousedown", startDrawing);
		canvas.addEventListener("mousemove", draw);
		canvas.addEventListener("mouseup", stopDrawing);

		// when we return erase handlers
		return () => {
			canvas.removeEventListener("mousedown", startDrawing);
			canvas.removeEventListener("mousemove", draw);
			canvas.removeEventListener("mouseup", stopDrawing);
		};
	}, [isDrawing, currentFrame, loadFrame, updateFrame]);


	// create a current frame with a splice
	const addNewFrame = () => {
		setFrames((prevFrames) => {
			const newFrames = [...prevFrames];
			newFrames.splice(currentFrame + 1, 0, "");
			return newFrames;
		});

		setCurrentFrame(currentFrame + 1);
	};

	const deleteFrame = () => {
		if (frames.length == 1) return;

		setFrames((prevFrames) => {
			const newFrames = prevFrames.filter((_, index) => index != currentFrame);	
			return newFrames;	
		});


		setCurrentFrame(Math.max(currentFrame - 1, 0));
	};

	// use loadFrame and setCurrentFrame handlers
	const goToPreviousFrame = () => {
		if (currentFrame > 0) {
			setCurrentFrame((prev) => prev - 1);
			loadFrame(currentFrame - 1);
		}
	}

	// pretty similar
	const goToNextFrame = () => {
		if (currentFrame + 1 < frames.length) {
			setCurrentFrame((prev) => prev + 1);
			loadFrame(currentFrame + 1);
		}
	}


	const playFrames = () => {
		if (isPlaying) {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
			setIsPlaying(false);
		} 
		else {
			let i = 0;
			const N = frames.length;
			intervalRef.current = setInterval(() => {
				loadFrame(i % N);
				setCurrentFrame(i % N);
				i++;
			}, 1000 / frameRate); // 24 frames per second

			setIsPlaying(true);
		}
	};

	// use the frameRate slider
	const handleFrameRate = (value: number) => {
		setFrameRate(value);
		console.log(frameRate);
	};

	// return div with canvas and a few buttons and inputs
	return (
		<div className="flex justify-center items-center h-screen bg-gray-100">
			<canvas ref={canvasRef} width={800} height={500} className="border bg-white"  />
			<p className="px-3 py-3">{frameRate}</p>
			<p className="px-3 py-3">{1 + currentFrame}</p>

			<div className="mt-4">
				<input id="frameRateSelector" className="block mb-2" type="range" min={12} max={60} value={frameRate} onChange={(e) => handleFrameRate(e.target.value)}/>
				<button className="bg-green-500 text-white px-4 py-3 rounded" onClick={addNewFrame}>new frame</button>
				<button className="bg-red-500 text-white px-4 py-3 rounded" onClick={deleteFrame}>delete frame</button>

				<button className="bg-blue-500 text-white px-4 py-3 rounded" onClick={goToPreviousFrame}>prev</button>
				<button className="bg-blue-500 text-white px-4 py-3 rounded" onClick={goToNextFrame}>next</button>
				<button className="bg-blue-500 text-white px-4 py-3 rounded" onClick={playFrames}>{isPlaying ? "stop" : "play" }</button>
			</div>
		</div>
	);
}
