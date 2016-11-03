#include <iostream>
#include <cmath>

using namespace std;

void print_matrix(float** M, size_t n){
    for(auto i = 0; i < n; ++i){
        for(auto j = 0; j < n; ++j){
            cout << M[i][j] << " ";
        }
        cout << "\n";
    }
}

void print_vector(float* M, size_t n){
    for(auto j = 0; j < n; ++j){
        cout << M[j] << " ";
    }
    cout << "\n";
}

float* gaussian_soltion(float** A, size_t n){

    for (int i=0; i<n; i++) {
        // Search for maximum in this column
        double maxEl = abs(A[i][i]);
        int maxRow = i;
        for (int k=i+1; k<n; k++) {
            if (abs(A[k][i]) > maxEl) {
                maxEl = abs(A[k][i]);
                maxRow = k;
            }
        }

        // Swap maximum row with current row (column by column)
        for (int k=i; k<n+1;k++) {
            double tmp = A[maxRow][k];
            A[maxRow][k] = A[i][k];
            A[i][k] = tmp;
        }

        // Make all rows below this one 0 in current column
        for (int k=i+1; k<n; k++) {
            double c = -A[k][i]/A[i][i];
            for (int j=i; j<n+1; j++) {
                if (i==j) {
                    A[k][j] = 0;
                } else {
                    A[k][j] += c * A[i][j];
                }
            }
        }
    }

    // Solve equation Ax=b for an upper triangular matrix A
    float* x = new float[n];
    for (int i=n-1; i>=0; i--) {
        x[i] = A[i][n]/A[i][i];
        for (int k=i-1;k>=0; k--) {
            A[k][n] -= A[k][i] * x[i];
        }
    }
    return x;
}


struct Node{
    size_t id;
    char BCType;// 'k' konwekcja -> temp., 'q' -> ciepło
    float BCValue; 
    float CoordX; // opcjonalne
    time_t time; // czas nagrzewania
};

struct Element{
    size_t id1, id2;
    float S, K, L;
    float** LH;
    float* LP;
    Node* n1;
    Node* n2;
    Element(float=0, float=0, float=0,Node* n1, Node* n2);
};

struct Mesh{
    Node* nodes;
    Element* elements;
    size_t numNodes, numElements;
};

Element::Element(float s, float k, float l, Node* N1, Node* N2){
    S = s;
    K = k;
    L = l;
    n1 = N1;
    n2 = N2;
    LH = new float* [2];
    for(auto i = 0; i < 2; ++i){
        LH[i] = new float[2];
    }
    for(auto i = 0; i < 2; ++i){
        for(auto j=0; j<2; ++j){
            if(i==0 && j==0){
                LH[i][j] = S * K / L;
            }
            if(i==1 && j==1) {
                LH[i][j] = -1 * S * K / L;
            }
            // LH[i][j] = pow(-1, (i+j)%2) * S*K/L;
        }
    }
    LP = new float[2];
    if(n1->BCType == 'k'){
        LP[0] = n1->
    }
}

int main() {

    const size_t M_size = 3;
    float tmp[][4] = {
        {40, -40, 0, 300},
        {-40, 80, -40, 0},
        {0, -40, 60, 8000}
    };

    float** M = new float*[M_size];
    // alloc
    for(auto i = 0; i < M_size; ++i){
        M[i] = new float[M_size];
    }
    // assign
    for(auto i = 0; i < M_size; ++i){
        for(auto j = 0; j < M_size + 1; ++j){
            M[i][j] = tmp[i][j];
        }
    }

    float* solution = new float[M_size];

    print_matrix(M, M_size);
    solution = gaussian_soltion(M, M_size);
    print_vector(solution, M_size);

    return 0;
}
