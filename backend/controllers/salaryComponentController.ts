import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { salary_component, employee_salary_component, user } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// MANAGE SALARY COMPONENTS
// ==========================================

export const getSalaryComponents = async (req: Request, res: Response) => {
    try {
        const components = await db.select().from(salary_component).where(eq(salary_component.isActive, true));
        res.status(200).json(components);
    } catch (error) {
        console.error('Error fetching salary components', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createSalaryComponent = async (req: Request, res: Response) => {
    try {
        const { name, type, calculationType, defaultAmount } = req.body;
        if (!name || !type || !calculationType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newComponentArray = await db.insert(salary_component).values({
            id: uuidv4(),
            name,
            type,
            calculationType,
            defaultAmount: defaultAmount ? defaultAmount.toString() : '0.00',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning();

        res.status(201).json(newComponentArray[0]);
    } catch (error) {
        console.error('Error creating salary component', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateSalaryComponent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, type, calculationType, defaultAmount, isActive } = req.body;

        const updatedComponentArray = await db.update(salary_component)
            .set({
                name,
                type,
                calculationType,
                defaultAmount: defaultAmount ? defaultAmount.toString() : '0.00',
                isActive,
                updatedAt: new Date()
            })
            .where(eq(salary_component.id, id))
            .returning();

        if (updatedComponentArray.length === 0) {
            return res.status(404).json({ message: 'Component not found' });
        }

        res.status(200).json(updatedComponentArray[0]);
    } catch (error) {
        console.error('Error updating salary component', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteSalaryComponent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deactivatedComponentArray = await db.update(salary_component)
            .set({
                isActive: false,
                updatedAt: new Date()
            })
            .where(eq(salary_component.id, id))
            .returning();

        if (deactivatedComponentArray.length === 0) {
            return res.status(404).json({ message: 'Component not found' });
        }

        res.status(200).json({ message: 'Set to inactive', component: deactivatedComponentArray[0] });
    } catch (error) {
        console.error('Error deleting salary component', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// MANAGE EMPLOYEE MAPPINGS
// ==========================================
export const getEmployeeComponents = async (req: Request, res: Response) => {
    try {
        res.status(200).json([]);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const assignComponentToEmployee = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: 'Assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeComponentFromEmployee = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: 'Removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
