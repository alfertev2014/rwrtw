/* eslint-disable @typescript-eslint/no-empty-object-type */
/// <reference no-default-lib="true"/>

interface Object {
  constructor: Function;
  toString(): string;
}

interface Array<T> {
  length: number;
  push(...items: T[]): number;
  [index: number]: T;
}

interface String {
  length: number;
  toUpperCase(): string;
}

interface Boolean {}
interface Number {}
interface Function {}
interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
interface RegExp {}
interface IArguments {}