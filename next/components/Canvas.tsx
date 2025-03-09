// client-side rendered
"use client";

import { useEffect, useRef, useState } from "react";

export default function Canvas() {
	// update canvas without rerender -> useref
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [isDrawing, setIsDrawing] = useState(false);
	const [frames, setFrames] = useState<string[]>([]);
	const [currentFrame, setCurrentFrame] = useState<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		// canvas context allows us to manipulate
		// the canvas
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// modify context
		ctx.lineWidth = 5;
		ctx.lineCap = "round";
		ctx.strokeStyle = "black";

		// handlers to begin a path, follow
		// and close path. secret sauce
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
			captureFrame();
		};

		const captureFrame = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			// base64 "image"
			const imageData = canvas.toDataURL();
			setFrames((prevFrames) => [...prevFrames.slice(0, currentFrame + 1), imageData]);
			setCurrentFrame((prev) => prev + 1);
		};

		// apply handlers
		canvas.addEventListener("mousedown", startDrawing);
		canvas.addEventListener("mousemove", draw);
		canvas.addEventListener("mouseup", stopDrawing);
		canvas.addEventListener("mouseleave", stopDrawing);

		// when we return erase handlers
		return () => {
			canvas.removeEventListener("mousedown", startDrawing);
			canvas.removeEventListener("mousemove", draw);
			canvas.removeEventListener("mouseup", stopDrawing);
			canvas.removeEventListener("mouseleave", stopDrawing);
		};
	}, [isDrawing, currentFrame]);

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

	const loadFrame = (index: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		// whattt
		const image = new Image();
		image.src = frames[index];

		// use callback to draw from array
		image.onload = () => {
			// optional chain
			ctx?.clearRect(0, 0, canvas.width, canvas.height);
			ctx?.drawImage(image, 0, 0);
		};
	};

	const playFrames = () => {
		let i = 0;
		const N = frames.length;
		setInterval(() => {
			loadFrame(i % N);
			setCurrentFrame(i % N);
			i++;
		}, 1000 / 24); // 24 frames per second
	};

	// return div with canvas
	return (
		<div className="flex justify-center items-center h-screen bg-gray-100">
			<canvas ref={canvasRef} width={800} height={500} className="border bg-white" />
			<div className="mt-4">
				<button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={goToPreviousFrame}>prev</button>
				<button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={goToNextFrame}>next</button>
				<button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={playFrames}>play</button>
			</div>
		</div>
	);
}
