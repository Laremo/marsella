tacos = int (input("¿Cuántos tacos te comiste? "))

if tacos >= 10:
    total_sin_descuento = tacos * 15
    total_con_descuento = total_sin_descuento * 0.10
    total_final = total_sin_descuento - total_con_descuento 
    print(" ¡Felicidades, ganaste el descuento por glotón!")
    print("Tu total a pagar es: $", total_final)
else:
    # Si no, se cobra el costo completo sin descuento
    total_sin_descuento = tacos * 15
    print("Tu total a pagar es: $", total_sin_descuento)