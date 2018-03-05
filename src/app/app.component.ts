import { Component, ViewChild, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Location } from '@angular/common';
import { EquippedStatsComponent } from './components/equipped-stats/equipped-stats.component';
import { EquippedSkillsComponent } from './components/equipped-skills/equipped-skills.component';
import { ItemStatsComponent } from './components/item-stats/item-stats.component';
import { DecorationSlotComponent } from './components/decoration-slot/decoration-slot.component';
import { ItemSlotComponent, ItemSlotClearModel } from './components/item-slot/item-slot.component';
import { ItemType } from './types/item.type';
import { ItemModel } from './models/item.model';
import { DecorationModel } from './models/decoration.model';
import { SkillService } from './services/skill.service';
import { TooltipService } from './services/tooltip.service';

import * as _ from 'lodash';
import { EquipmentCategoryType } from './types/equipment-category.type';

@Component({
	selector: 'mhw-builder-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
	public itemTypes = ItemType;
	title = 'MHW Builder';
	buildId = '';

	@ViewChild(EquippedStatsComponent) equippedStatsComponent: EquippedStatsComponent;
	@ViewChild(EquippedSkillsComponent) equippedSkillsComponent: EquippedSkillsComponent;
	@ViewChild(ItemStatsComponent) itemStatsComponent: ItemStatsComponent;
	@ViewChild('itemStats') itemStatsContainer: ElementRef;

	selectedEquipmentSlot: ItemSlotComponent;
	selectedDecorationSlot: DecorationSlotComponent;
	equippedItems = new Array<ItemModel>();
	equippedDecorations = new Array<DecorationModel>();

	constructor(
		private tooltipService: TooltipService,
		private skillService: SkillService,
		private renderer: Renderer2,
		private location: Location
	) { }

	ngOnInit() {
		this.tooltipService.subject.subscribe((thing: ItemModel | DecorationModel) => {
			if (!thing) {
				this.renderer.setStyle(this.itemStatsContainer.nativeElement, 'display', 'none');
			} else {
				this.renderer.setStyle(this.itemStatsContainer.nativeElement, 'display', 'block');
				this.itemStatsComponent.setItem(thing);
			}
		});
	}

	selectItem(selectedItem: ItemModel) {
		if (this.selectedEquipmentSlot) {
			this.selectedEquipmentSlot.item = selectedItem;

			this.equippedItems = _.reject(this.equippedItems, (item: ItemModel) => {
				return item.itemType == selectedItem.itemType;
			});

			this.equippedItems.push(selectedItem);
			this.updateStatsAndSkills();
		}

		this.updateBuildId();
	}

	selectDecoration(selectedDecoration: DecorationModel) {
		if (this.selectedDecorationSlot) {
			this.selectedDecorationSlot.decoration = selectedDecoration;

			this.equippedDecorations = _.reject(this.equippedDecorations, (decoration: DecorationModel) => {
				return decoration === selectedDecoration;
			});

			selectedDecoration.equipmentId = this.selectedDecorationSlot.item.id;
			this.equippedDecorations.push(selectedDecoration);
			this.updateStatsAndSkills();
		}

		this.updateBuildId();
	}

	itemLevelChanged() {
		this.updateStatsAndSkills();
	}

	itemCleared(clear: ItemSlotClearModel) {
		this.equippedItems = _.reject(this.equippedItems, (item: ItemModel) => {
			return item === clear.item;
		});

		if (clear.decorations) {
			// TODO: this causes the equipped skills component to update more than it needs to - fix it.
			for (const decoration of clear.decorations) {
				this.decorationCleared(decoration);
			}
		}

		this.updateStatsAndSkills();
	}

	decorationCleared(clearedDecoration: DecorationModel) {
		this.equippedDecorations = _.reject(this.equippedDecorations, (decoration: DecorationModel) => {
			return decoration === clearedDecoration;
		});

		this.updateStatsAndSkills();
	}

	private updateStatsAndSkills() {
		this.skillService.updateSkills(this.equippedItems, this.equippedDecorations);
		this.equippedStatsComponent.update(this.equippedItems);
		this.equippedSkillsComponent.update();
	}

	itemSlotSelected(equipmentSlot: ItemSlotComponent) {
		if (this.selectedEquipmentSlot) {
			this.selectedEquipmentSlot.selected = false;
		}

		if (this.selectedDecorationSlot) {
			this.selectedDecorationSlot.selected = false;
		}

		this.selectedDecorationSlot = null;

		this.selectedEquipmentSlot = equipmentSlot;
		this.selectedEquipmentSlot.selected = true;
	}

	decorationSlotSelected(decorationSlot: DecorationSlotComponent) {
		if (this.selectedEquipmentSlot) {
			this.selectedEquipmentSlot.selected = false;
		}

		if (this.selectedDecorationSlot) {
			this.selectedDecorationSlot.selected = false;
		}

		this.selectedEquipmentSlot = null;

		this.selectedDecorationSlot = decorationSlot;
		this.selectedDecorationSlot.selected = true;
	}

	moveTooltip(event: MouseEvent) {
		let newTop = event.clientY + 40;
		let newLeft = event.clientX + 40;

		if (window.innerHeight < newTop + this.itemStatsContainer.nativeElement.scrollHeight) {
			newTop = window.innerHeight - this.itemStatsContainer.nativeElement.scrollHeight;
		}

		if (window.innerWidth < newLeft + this.itemStatsContainer.nativeElement.scrollWidth) {
			newLeft = window.innerWidth - this.itemStatsContainer.nativeElement.scrollWidth;
		}

		this.renderer.setStyle(this.itemStatsContainer.nativeElement, 'left', newLeft + 'px');
		this.renderer.setStyle(this.itemStatsContainer.nativeElement, 'top', newTop + 'px');
	}

	updateBuildId() {
		const weapon = this.equippedItems.find(item => item.equipmentCategory == EquipmentCategoryType.Weapon);
		const head = this.equippedItems.find(item => item.itemType == ItemType.Head);
		const chest = this.equippedItems.find(item => item.itemType == ItemType.Chest);
		const hands = this.equippedItems.find(item => item.itemType == ItemType.Hands);
		const legs = this.equippedItems.find(item => item.itemType == ItemType.Legs);
		const feet = this.equippedItems.find(item => item.itemType == ItemType.Feet);
		const charm = this.equippedItems.find(item => item.itemType == ItemType.Charm);

		this.buildId = 'v1';

		this.buildId += this.getItemBuildString(weapon);
		this.buildId += this.getItemBuildString(head);
		this.buildId += this.getItemBuildString(chest);
		this.buildId += this.getItemBuildString(hands);
		this.buildId += this.getItemBuildString(legs);
		this.buildId += this.getItemBuildString(feet);
		this.buildId += this.getItemBuildString(charm);

		this.location.replaceState(this.location.path(false), '#' + this.buildId);
	}

	getItemBuildString(item: ItemModel): string {
		let result = 'i';

		if (item) {
			result += item.id.toString();

			const decorations = _.filter(this.equippedDecorations, decoration => decoration.equipmentId == item.id);
			for (const decoration of decorations) {
				result += `d${decoration.id.toString()}`;
			}
		}

		return result;
	}
}
