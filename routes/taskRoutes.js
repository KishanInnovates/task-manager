const express = require("express");
const Task = require("../models/task");
const router = express.Router();
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const roleMiddleware = require("../middlewares/roleMiddleware");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "Access Denied" });
  try {
    const verified = jwt.verify(token.replace("Bearer ", ""), "Kishaneha");
    req.user = verified;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token!" });
  }
};

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long!"),
  description: z.string().optional(),
  completed: z.boolean().default(false),
});

router.post("/tasks", async (req, res) => {
  try {
    const validatedData = taskSchema.parse(req.body);
    const task = new Task(validatedData);
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/tasks/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(400).json({ message: "Task not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const validatedData = taskSchema.partial().parse(req.body);
    const task = await Task.findByIdAndUpdate(req.params.id, validatedData, {
      new: true,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Task
router.delete(
  "/tasks/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json({ message: "Task deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

//create task (protected)
router.post(
  "/tasks",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const task = new Task({ ...req.body, userId: req.user.userId });
      await task.save();
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

//get task protected
router.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
