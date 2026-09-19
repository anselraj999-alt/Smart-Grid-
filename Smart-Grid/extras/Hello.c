#include<stdio.h>

int main(){
 int a,b;
 printf("enter two numbers");
 scanf("%d%d",&a,&b);

 for(int i=0;i<=5;i++){
  int sum=a+b;
  printf("values is%d\n",sum);
 }

  return 0;
}
