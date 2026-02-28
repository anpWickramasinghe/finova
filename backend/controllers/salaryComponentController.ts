import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { salary_component, employee_salary_component, user } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// ==========================================
// MANAGE SALARY COMPONENTS
// ==========================================

const MOCK_COMPONENTS = [
    {
        id: "comp-1",
        name: "Housing Allowance",
        type: "Earning",
        calculationType: "Fixed",
        defaultAmount: "5000",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "comp-2",
        name: "Tax Deduction",
        type: "Deduction",
        calculationType: "PercentageOfBase",
        defaultAmount: "5",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const getSalaryComponents = async (req: Request, res: Response) => {
    try {
        res.status(200).json(MOCK_COMPONENTS);
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

        const newComponent = {
            id: uuidv4(),
            name,
            type,
            calculationType,
            defaultAmount: defaultAmount ? defaultAmount.toString() : '0',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        res.status(201).json(newComponent);
    } catch (error) {
        console.error('Error creating salary component', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateSalaryComponent = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: 'updated' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteSalaryComponent = async (req: Request, res: Response) => {
    try {
        res.status(200).json({ message: 'Set to inactive' });
    } catch (error) {
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
