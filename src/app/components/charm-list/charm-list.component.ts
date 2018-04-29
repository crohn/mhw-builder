import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import * as _ from 'lodash';
import { EquipmentCategoryType } from '../../types/equipment-category.type';
import { ItemType } from '../../types/item.type';
import { VirtualScrollComponent } from 'angular2-virtual-scroll';
import { ItemModel } from '../../models/item.model';
import { SlotService } from '../../services/slot.service';
import { DataService } from '../../services/data.service';
import { SkillModel } from '../../models/skill.model';

@Component({
	selector: 'mhw-builder-charm-list',
	templateUrl: './charm-list.component.html',
	styleUrls: ['./charm-list.component.scss']
})
export class CharmListComponent implements OnInit {
	public equipmentCategoryType = EquipmentCategoryType;

	private _itemType: ItemType;

	@Input()
	set itemType(itemType: ItemType) {
		this._itemType = itemType;
		this.loadItems();
	}
	get itemType(): ItemType { return this._itemType; }

	@ViewChild('searchBox') searchBox: ElementRef;
	@ViewChild('itemList') itemList: VirtualScrollComponent;

	items: ItemModel[];
	filteredItems: ItemModel[];
	virtualItems: ItemModel[];

	constructor(
		private slotService: SlotService,
		public dataService: DataService
	) { }

	ngOnInit(): void { }

	loadItems() {
		this.items = this.dataService.getArmorByType(this.itemType) as ItemModel[];
		this.resetSearchResults();
	}

	search(query: string) {
		this.filteredItems = this.items;

		if (query) {
			query = query.toLowerCase().trim();
			const queryParts = query.split(' ');

			if (this.items) {
				for (const item of this.items) {
					const itemName = item.name.toLowerCase();
					const skills = this.dataService.getSkills(item.skills);

					let match = _.some(queryParts, queryPart => {
						const nameMatch = itemName.includes(queryPart);
						const skillMatch = _.some(skills, skill => skill.name.toLowerCase().includes(queryPart));
						const tagMatch = _.some(item.tags, tag => tag.toLowerCase().includes(queryPart));

						return nameMatch || skillMatch || tagMatch;
					});

					let hiddenMatch = true;
					if (_.some(queryParts, queryPart => queryPart === 'hidden')) {
						hiddenMatch = (item.elementHidden || item.ailmentHidden);

						if (queryParts.length < 2) {
							match = true;
						}
					}

					if (!match || !hiddenMatch) {
						this.filteredItems = _.reject(this.filteredItems, i => i.name === item.name);
					}
				}
			}
		} else {
			this.resetSearchResults();
		}
	}

	resetSearchResults() {
		this.searchBox.nativeElement.value = null;
		this.filteredItems = this.items;
	}

	onItemListUpdate(items: ItemModel[]) {
		this.virtualItems = items;
	}

	selectItem(item: ItemModel) {
		const newItem = Object.assign({}, item);
		this.slotService.selectItem(newItem);
	}

	getSkillCount(item: ItemModel, skill: SkillModel): string {
		const itemSkill = _.find(item.skills, s => s.id == skill.id);
		const result = `${itemSkill.level}/${skill.levels.length}`;
		return result;
	}
}