palabra_correcta = ""

palabra_usuario = ""

adivinanza = ""

def crear_adivinanza():
    adivinanza = input("Ingresa el texto de la adivinanza: ")
    return adivinanza

def crear_respuesta():
    palabra_correcta = input("Ingresa la respuesta de la adivinanza: ")
    return palabra_correcta

while(True):
    adivinanza = crear_adivinanza()
    palabra_correcta = crear_respuesta()

    if(adivinanza != "" and palabra_correcta != ""):
        while palabra_usuario != palabra_correcta:
            print("/// ADIVINANZA ///")
            print(adivinanza)
            palabra_usuario = input("Escribe la respuesta: ")
        print("Tas bien")
    else:
        print("Error, no puedes ingresar texto vacío.")

