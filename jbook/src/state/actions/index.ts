import { ActionType } from '../action-types';
import { CellTypes } from '../cell';

export type Direction = 'up' | 'down';
export interface MoveCellAction {
  type: ActionType.MOVE_CELL;
  payload: {
    id: string;
    direction: Direction;
  };
}

export interface DeleteCellAction {
  type: ActionType.DELETE_CELL;
  payload: string;
}

export interface InsertCellAfterAction {
  type: ActionType.INSERT_CELL_AFTER;
  payload: {
    id: string;
    type: CellTypes;
  };
}

export interface UpdateCellAction {
  type: ActionType.UPDATE_CELL;
  payload: {
    id: string;
    content: string;
  };
}

export interface BundleStart {
  type: ActionType.BUNDLE_START,
  paload: {
    cellId: string;
  };
}

export interface BundleComplete {
  type: ActionType.BUNDLE_COMPLETE,
  payload: {
    cellId: string;
    bundle: {
      code: string;
      err: string;
    }
  };
}

export type Action =
  | MoveCellAction
  | DeleteCellAction
  | InsertCellAfterAction
  | UpdateCellAction
  | BundleStart
  | BundleComplete;
