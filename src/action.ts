import SubjectPath from "./data-structures/subject-path";
import Subject from "./subject/subject";

export type ShowActionName = "show";
export type CreateActionName = "create";
export type EditActionName = "edit";
export type ReplaceActionName = "replace";
export type DeleteActionName = "delete";
export type ListActionName = "list";
export type ActionName =
	| ShowActionName
	| CreateActionName
	| EditActionName
	| ReplaceActionName
	| DeleteActionName
	| ListActionName;
