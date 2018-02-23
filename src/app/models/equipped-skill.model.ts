import { SkillModel } from './skill.model';

export class EquippedSkillModel {
	skill: SkillModel;
	id: string;
	name: string;
	description: string;
	equippedCount: number;
	setEquippedCount: number;
	totalLevelCount: number;
}