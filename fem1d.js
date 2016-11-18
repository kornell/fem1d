var fs = require('fs');
var mesh;
var abs = Math.abs;
// funkcja pomocnicza twrzaca tablice wartosci v o rozmiarze n 
function array_fill(i, n, v) {
    var a = [];
    for (; i < n; i++) {
        a.push(v);
    }
    return a;
}


 // eliminacja Gaussa
function gauss(A, x) {
    var i, k, j;
    // utworzenie macierzy rozwiazan
    for (i=0; i < A.length; i++) { 
        A[i].push(x[i]);
    }
    var n = A.length;
    for (i=0; i < n; i++) { 
        // najwieksza wartosc 
        var maxEl = abs(A[i][i]),
            maxRow = i;
        for (k=i+1; k < n; k++) { 
            if (abs(A[k][i]) > maxEl) {
                maxEl = abs(A[k][i]);
                maxRow = k;
            }
        }
        // zmaiana najwyzszego wiersza  z biezacym
        for (k=i; k < n+1; k++) { 
            var tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }
        // zerowanie kolumny
        for (k=i+1; k < n; k++) { 
            var c = -A[k][i]/A[i][i];
            for (j=i; j < n+1; j++) { 
                if (i===j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
        }
    }
    // rozwiazanie dla macierzy trojkatnej gornej 
    x = array_fill(0, n, 0);
    for (i=n-1; i > -1; i--) { 
        x[i] = A[i][n]/A[i][i];
        for (k=i-1; k > -1; k--) { 
            A[k][n] -= A[k][i] * x[i];
        }
    }
    return x;
}


// funkcja: dodaj do macierzy a macierz b przesunieta o n wymiarow
// to jest: o `n` kolumn w prawo, o n wierszy w dol
function addShiftedArray(a, b, n){
  var aNumRows = a.length, aNumCols = a[0].length,
      bNumRows = b.length, bNumCols = b[0].length,
      m, n;
  m = a;
  if(n === undefined){
    n = 0;
  }

  for(var i = 0; (i < b.length) && (i + n < a.length); ++i){
    for(var j = 0; (j < b[0].length) && (j + n < a[0].length); ++j){
      m[i + n][j + n] += b[i][j];
    }
  }
  return m;
}

fs.readFile('meshdata.json', 'utf8', function (err, data) {
  if (err) 
    throw err;
  mesh = JSON.parse(data).meshes[1]; // wczytanie z pliku
  if(!mesh || mesh.length === 0)
    throw new "Siatka MES nie ma podanych elementow! (Blad pliku)";
    
    mesh.elements.forEach(function(element, index, array){
      // utworz lokalne [H] dla kazdego elementu
      element.LH[0] = [];
      element.LH[1] = [];
      var sign = 1;
      
      for(var i = 0; i < 2; ++i){
        for(var j = 0; j < 2; ++j){
          if(i !== j)
              sign = -1;
          else
              sign = 1;
          element.LH[i][j] = sign * element.S * element.k / element.L;
          if(element.nodes[i*j].BCType === "conv"){
            element.LH[i][j] += element.nodes[i].alfa * element.S;
          }
        }
      }
    });

    // generowanie tablicy globalnej [H] o rozmiarze: [ilosc elementow + 1]^2
    var HSize = mesh.elements.length + 1;
    mesh.H = [];
    for(var i = 0; i < HSize; ++i){
      mesh.H[i] = [];
      for(var j = 0; j < HSize; ++j){
        mesh.H[i][j] = 0;
      }
    }

    // sortowanie wezlow wewnatrz elementow 
    mesh.elements.forEach((element) =>
      element.nodes.sort((node1, node2) => node1.id - node2.id)
    );

    // sortowanie elementow na podstawie pierwszego wezla 
    mesh.elements.sort(function(elem1, elem2){
      return elem1.nodes[0].id - elem2.nodes[0].id;
    });

    // dla 2 elementow: mesh.H = [ [0, 0, 0], [0, 0, 0], [0, 0, 0] ];
    var P_ID = 1, loopCount = 1, numNodes = mesh.elements[0].nodes.length;
    mesh.elements.forEach(function(element, elementIndex){
      element.nodes.forEach(function(node){
        if(node.BCType === null && mesh.P[P_ID] === undefined){
            mesh.P[P_ID-1] = 0;
        } else { // obciazenie jest niezerowe
          if(node.BCType === "heat"){ // energia w postaci ciepla
            mesh.P[P_ID-1] = (node.q * element.S);
          } else if(node.BCType === "conv"){ // konwekcja
            mesh.P[P_ID-1] = ((-1) * node.alfa * node.t_inf * element.S);
          }
        }
        if(++loopCount === numNodes){
          loopCount = 0;
          ++P_ID;
        }
      });
      mesh.H = addShiftedArray(mesh.H, element.LH, elementIndex);
    });
    mesh.P = mesh.P.map(function(e){return -e;})
    mesh.t = gauss(mesh.H, mesh.P);
    console.log("\n\n{P}: ", mesh.P, "\n\n");
    console.log("\n\n[H]: ", mesh.H);
    console.log("\n\n{t}: ", mesh.t);
});