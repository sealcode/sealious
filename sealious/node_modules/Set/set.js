module.exports = Set;

function Set(set) {
  this.set = {};
  this.infContains = function () { return true; };

  if (typeof set == 'object') {
    if (set instanceof Array)
      for (var i = 0; i < set.length; i++)
        this.set[set[i]] = true;
    else
      this.set = set;
  } else if (typeof set == 'function') {
    this.infContains = set;
  } else if (typeof set != 'undefined')
    throw new Error('set must be either an array or an object.');
}

Set.prototype.contains = function contains(val) {
  return this.set[val] ? true : false && this.infContains(val);
};
Set.prototype.has = Set.prototype.contains;

Set.prototype.add = function add(val) {
  if (arguments.length == 1)
    this.set[val] = true;
  else
    for (var i = 0; i < arguments.length; i++)
      this.set[arguments[i]] = true;
};

Set.prototype.addAll = function addAll(arr) {
  if (typeof arr != 'object' && !(arr instanceof Array))
    throw new Error('arr must be an array.');

  for (var i = 0; i < arr.length; i++)
    this.add(arr[i]);
}

Set.prototype.remove = function remove(val) {
  if (arguments.length == 1)
    delete this.set[val];
  else
    for (var i = 0; i < arguments.length; i++)
      delete this.set[arguments[i]];
};
Set.prototype['delete'] = Set.prototype.remove;

Set.prototype.clear = function clear() {
  this.set = {};
};

Set.prototype.size = function size() {
  return Object.keys(this.set).length;
};

Set.prototype.toString = function toString() {
  return '{'+Object.keys(this.set).toString()+'}';
};

Set.prototype.toArray = function toArray() {
  if (typeof this.set == 'undefined')
    return [];

  return Object.keys(this.set);
};
Set.prototype['*values'] = Set.prototype.toArray;
