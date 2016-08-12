# Sealious reference

## SubjectPath

Represents a path in Subject graph. May or may not lead to an existing subject.

### API

#### Constructor

* `new Sealious.SubjectPath(path: String)`
    * `path: String`: a dot-delimeted string representing a sequence of edge labels that lead to the desired subject
  
  Example:
  ```js
  var path = new Sealious.SubjectPath("resources.users.82fc0dc12a");
  ```

* `new Sealious.SubjectPath(path: Array[String])`
    * `path: Array[String]`: a list of edge labels that lead to the desired subject

    Example:
    ```js
    var path = new Sealious.SubjectPath(["resources", "users", "82fc0dc12a"]);
    ```

* `new Sealious.SubjectPath(path: SubjectPath)`
    * `path: SubjectPath`: an instance of SubjectPath representing the desired subject

    This constructor will create a copy of the SubjectPath passed as an argument.

    Example:
    ```js
    var path = new Sealious.SubjectPath(["resources", "users", "82fc0dc12a"]);
    var path_copy = new Sealious.SubjectPath(path);
    ```

#### Methods

* `subject_path.clone() => SubjectPath`

  Returns a copy of the path

* `subject_path.head() => String`
  
  Returns the first element of the path

* `subject_path.tail() => Array[String]`
  
  Returns an array of path elements, without its first element

## Subjects

All user actions in Sealious should be translated to a certain action on a can certain subject. Subjects can be thought of as nodes in a directed graph. You can read more about them in the Sealious Handbook

Each subject is identified by a Subject Path

### Subject types

There are 2 built-in subject types:
    