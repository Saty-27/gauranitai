import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import bcryptjs from "bcryptjs";
import { storage } from "../storage";

export function setupAuthRoutes(app: Express) {
  // LOGIN endpoint - check email/password against database
  app.post("/api/auth/login", async (req: any, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Check if user exists with this email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({
          message: "User not found. Please sign up first.",
          code: "USER_NOT_FOUND",
        });
      }

      // Check if user is blocked
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account has been blocked. Please contact support.",
          code: "USER_BLOCKED",
        });
      }

      // Verify password
      const passwordMatch = await bcryptjs.compare(
        password,
        user.passwordHash || ""
      );

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Update lastLogin
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Create session
      req.session.userId = user.id;
      req.session.userRole = user.role;
      req.session.userEmail = user.email;

      console.log("📝 Setting session:", {
        sessionId: req.sessionID,
        userId: user.id,
        email: user.email,
      });

      req.session.save((err: any) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return res
            .status(500)
            .json({ message: "Failed to create session" });
        }

        console.log("✅ Session saved successfully:", {
          sessionId: req.sessionID,
          userId: req.session.userId,
        });

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
          },
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // SIGNUP endpoint - create new user (with optional file upload)
  app.post("/api/auth/signup", async (req: any, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone, address } = req.body;
      const profilePhoto = req.files?.profilePhoto;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: "Password must be at least 6 characters",
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);

      if (existingUser) {
        return res.status(409).json({
          message: "Email already registered. Please login instead.",
          code: "USER_EXISTS",
        });
      }

      // Hash password
      const salt = await bcryptjs.genSalt(10);
      const passwordHash = await bcryptjs.hash(password, salt);

      // For profile photo, we'll store as base64 or URL in a simple implementation
      let profileImageUrl = undefined;
      if (profilePhoto) {
        // In production, upload to cloud storage
        // For now, store file name or create a reference
        profileImageUrl = `/uploads/${profilePhoto.name}`;
      }

      // Create new user
      const newUser = await storage.createUserWithPassword({
        id: nanoid(),
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        address,
        profileImageUrl,
        role: "customer",
        isActive: true,
        lastLogin: new Date(),
      });

      // Create session
      req.session.userId = newUser.id;
      req.session.userRole = newUser.role;
      req.session.userEmail = newUser.email;

      req.session.save((err: any) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Failed to create session" });
        }

        res.status(201).json({
          message: "Signup successful",
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            role: newUser.role,
          },
        });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // GET current user from session - fetch full user details from database
  app.get("/api/auth/current-user", async (req: any, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      // Fetch full user details from database
      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is blocked
      if (user.isActive === false) {
        req.session.destroy(() => {});
        return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // POST change password (profile page)
  app.post("/api/auth/change-password", async (req: any, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check current password
      const isMatch = await bcryptjs.compare(currentPassword, user.passwordHash || "");
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Hash new password
      const salt = await bcryptjs.genSalt(10);
      const newHash = await bcryptjs.hash(newPassword, salt);

      // Update user password
      await storage.updateUser(user.id, { passwordHash: newHash });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // ADMIN LOGIN endpoint - specific credentials for admin access
  app.post("/api/admin/login", async (req: any, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      // Check admin credentials from environment or defaults
      const adminUsername = process.env.ADMIN_USERNAME || "GauranitaiMDSummitShah";
      const adminPassword = process.env.ADMIN_PASSWORD || "Gauranitai@2026";

      if (username !== adminUsername || password !== adminPassword) {
        console.log("❌ Admin login failed: Invalid credentials for", username);
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Create admin session
      req.session.isAdminLoggedIn = true;
      req.session.adminUsername = username;

      req.session.save((err: any) => {
        if (err) {
          console.error("❌ Admin session save error:", err);
          return res
            .status(500)
            .json({ message: "Failed to create session" });
        }

        console.log("✅ Admin session created:", {
          sessionId: req.sessionID,
          admin: username,
        });

        res.json({
          message: "Admin login successful",
          admin: {
            username: username,
          },
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  // GET current admin session
  app.get("/api/admin/current-admin", (req: any, res: Response) => {
    console.log("🔍 Checking admin session:", {
      sessionId: req.sessionID,
      isAdminLoggedIn: req.session?.isAdminLoggedIn,
      username: req.session?.adminUsername
    });

    if (!req.session?.isAdminLoggedIn) {
      return res.status(401).json({ message: "Not authenticated as admin" });
    }

    res.json({
      username: req.session.adminUsername,
    });
  });

  // ADMIN LOGOUT endpoint
  app.post("/api/admin/logout", (req: any, res: Response) => {
    req.session.isAdminLoggedIn = false;
    req.session.adminUsername = null;
    req.session.save(() => {
      res.json({ message: "Admin logged out" });
    });
  });

  // LOGOUT endpoint
  app.post("/api/auth/logout", (req: any, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });
}
